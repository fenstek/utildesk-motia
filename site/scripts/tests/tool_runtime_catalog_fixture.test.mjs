import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "vite";
import test from "node:test";
import { refreshToolCatalogs } from "../lib/tool-runtime-catalog-publisher.mjs";
import { RUNTIME_TOOL_CATALOG_MANIFEST_SQL } from "../../shared/toolCatalogManifestQuery.mjs";

const siteRoot = new URL("../..", import.meta.url).pathname;
const migrationRoot = new URL("../../runtime/migrations/", import.meta.url);
const seedPath = new URL("../../runtime/fixtures/tool_catalog_cache_seed.sql", import.meta.url);

test("local D1 fixture bootstraps, refreshes, fails safe, rolls back, retires and restores both catalogs", async () => {
  const db = new DatabaseSync(":memory:");
  const uploaded = new Map();
  let failUpload = false;
  let vite;
  try {
    const migrations = (await readdir(migrationRoot)).filter((name) => name.endsWith(".sql")).sort();
    for (const migration of migrations) db.exec(await readFile(new URL(migration, migrationRoot), "utf8"));
    db.exec(await readFile(seedPath, "utf8"));
    db.prepare("UPDATE runtime_collection_revisions SET revision = CASE locale WHEN 'de' THEN 9 ELSE 8 END WHERE kind = 'tool'").run();

    const queryD1 = async ({ sql, params = [] }) => [{ results: db.prepare(sql).all(...params).map((row) => ({ ...row })) }];
    const executeD1Batch = async ({ statements }) => {
      db.exec("BEGIN");
      try {
        const results = statements.map(({ sql, params = [] }) => db.prepare(sql).run(...params));
        db.exec("COMMIT");
        return results.map((result) => ({ success: true, meta: { changes: Number(result.changes) } }));
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    };
    const uploadObjects = async (catalogs) => {
      if (failUpload) throw new Error("fixture R2 write failed");
      for (const catalog of Object.values(catalogs)) uploaded.set(catalog.objectKey, catalog.body);
      return Object.values(catalogs).map(({ locale, objectKey, contentHash, bytes }) => ({ locale, objectKey, contentHash, bytes }));
    };
    const refresh = () => refreshToolCatalogs({
      connection: {},
      queryD1,
      executeD1Batch,
      bucket: "fixture-only-r2",
      siteDir: siteRoot,
      uploadObjects,
      maxAttempts: 2,
    });

    const initial = await refresh();
    assert.equal(initial.d1RowsWritten, 2);
    assert.deepEqual(initial.locales.map(({ locale }) => locale), ["de", "en"]);
    const firstManifest = db.prepare("SELECT locale, collection_revision, primary_collection_revision, etag, object_key FROM runtime_tool_catalogs ORDER BY locale").all().map((item) => ({ ...item }));
    assert.equal(firstManifest.length, 2);
    const firstEN = firstManifest.find(({ locale }) => locale === "en");
    assert.equal(firstEN.collection_revision, 8);
    assert.equal(firstEN.primary_collection_revision, 9);
    assert.equal(db.prepare(RUNTIME_TOOL_CATALOG_MANIFEST_SQL).get("en").object_key, firstEN.object_key);
    assert.equal(JSON.parse(uploaded.get(firstManifest[0].object_key)).count, 1);
    assert.equal(JSON.parse(uploaded.get(firstManifest[1].object_key)).count, 1);

    db.prepare("UPDATE content_entries SET popularity = 11 WHERE kind = 'tool' AND locale = 'de' AND slug = 'catalog-fixture'").run();
    const duringDeOnly = db.prepare(RUNTIME_TOOL_CATALOG_MANIFEST_SQL).get("en");
    assert.equal(duringDeOnly.collection_revision, 8);
    assert.equal(duringDeOnly.primary_collection_revision, 10);
    assert.equal(duringDeOnly.object_key, null, "EN prepared data is hidden between the DE write and paired refresh");
    const deOnlyRefresh = await refresh();
    const afterDeOnly = db.prepare(RUNTIME_TOOL_CATALOG_MANIFEST_SQL).get("en");
    assert.equal(afterDeOnly.collection_revision, 8);
    assert.equal(afterDeOnly.primary_collection_revision, 10);
    assert.notEqual(afterDeOnly.etag, firstEN.etag);
    assert.equal(JSON.parse(uploaded.get(afterDeOnly.object_key)).items[0].popularity, 11);
    assert.equal(deOnlyRefresh.d1RowsWritten, 2);

    db.prepare(`UPDATE content_entries
      SET title = CASE locale WHEN 'en' THEN 'Fixture Card updated' ELSE 'Fixture Karte aktualisiert' END,
          source_hash = source_hash || '-v2', revision = revision + 1
      WHERE kind = 'tool' AND slug = 'catalog-fixture'`).run();
    const oldPointerRevision = db.prepare("SELECT collection_revision FROM runtime_tool_catalogs WHERE locale = 'de'").get().collection_revision;
    failUpload = true;
    await assert.rejects(refresh(), /fixture R2 write failed/);
    failUpload = false;
    const newCollectionRevision = db.prepare("SELECT revision FROM runtime_collection_revisions WHERE kind = 'tool' AND locale = 'de'").get().revision;
    assert.ok(newCollectionRevision > oldPointerRevision);
    assert.equal(db.prepare("SELECT collection_revision FROM runtime_tool_catalogs WHERE locale = 'de'").get().collection_revision, 10);
    assert.equal(db.prepare(RUNTIME_TOOL_CATALOG_MANIFEST_SQL).get("en").object_key, null,
      "a new DE revision hides the prior EN pointer after the failed pair refresh");
    assert.equal(db.prepare(RUNTIME_TOOL_CATALOG_MANIFEST_SQL).get("de").object_key, null,
    "a stale manifest cannot be selected after D1 changes; runtime falls back to the current D1 renderer");

    const updated = await refresh();
    assert.equal(updated.locales.length, 2);
    assert.notEqual(updated.locales.find(({ locale }) => locale === "en").etag, firstEN.etag);
    const updatedPointer = db.prepare("SELECT object_key FROM runtime_tool_catalogs WHERE locale = 'en'").get().object_key;
    assert.equal(JSON.parse(uploaded.get(updatedPointer)).items[0].title, "Fixture Card updated");

    db.prepare(`UPDATE content_entries
      SET title = CASE locale WHEN 'en' THEN 'Fixture Card' ELSE 'Fixture Karte' END,
          source_hash = CASE locale WHEN 'en' THEN 'fixture-v1-en' ELSE 'fixture-v1-de' END,
          revision = revision + 1
      WHERE kind = 'tool' AND slug = 'catalog-fixture'`).run();
    const rollback = await refresh();
    assert.equal(rollback.locales.length, 2);
    const rolledBack = db.prepare("SELECT object_key FROM runtime_tool_catalogs WHERE locale = 'en'").get().object_key;
    assert.equal(JSON.parse(uploaded.get(rolledBack)).items[0].title, "Fixture Card");

    db.prepare(`UPDATE content_entries
      SET is_active = 0, route_state = 'redirect', redirect_target_path = CASE locale WHEN 'en' THEN '/en/tools/catalog-target/' ELSE '/tools/catalog-target/' END,
          revision = revision + 1
      WHERE kind = 'tool' AND slug = 'catalog-fixture'`).run();
    const redirected = await refresh();
    assert.equal(redirected.locales.length, 2);
    assert.equal(db.prepare("SELECT redirect_target_path FROM content_entries WHERE kind = 'tool' AND locale = 'en' AND slug = 'catalog-fixture'").get().redirect_target_path, "/en/tools/catalog-target/");
    const redirectCatalog = db.prepare("SELECT object_key FROM runtime_tool_catalogs WHERE locale = 'de'").get().object_key;
    assert.equal(JSON.parse(uploaded.get(redirectCatalog)).count, 0);

    db.prepare(`UPDATE content_entries
      SET is_active = 1, route_state = 'active', redirect_target_path = NULL, deleted_at = NULL, revision = revision + 1
      WHERE kind = 'tool' AND slug = 'catalog-fixture'`).run();
    const restored = await refresh();
    assert.equal(restored.locales.length, 2);
    const restoredCatalog = db.prepare("SELECT object_key FROM runtime_tool_catalogs WHERE locale = 'de'").get().object_key;
    assert.equal(JSON.parse(uploaded.get(restoredCatalog)).count, 1);
  } finally {
    await vite?.close();
    db.close();
  }
});
