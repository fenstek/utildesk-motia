import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import test, { after, before } from "node:test";
import {
  buildToolCatalogManifestStatement,
  buildToolCatalogObjects,
  D1_MAX_ROW_BYTES,
} from "../lib/tool-runtime-catalog-publisher.mjs";
import { getToolRoutePolicyHash } from "../../shared/toolRoutePolicy.mjs";
import { RUNTIME_TOOL_CATALOG_MANIFEST_SQL } from "../../shared/toolCatalogManifestQuery.mjs";

const siteRoot = fileURLToPath(new URL("../..", import.meta.url));
const row = (locale, slug, overrides = {}) => ({
  content_key: `tool:${locale}:${slug}`,
  kind: "tool",
  locale,
  slug,
  title: slug === "chatgpt" ? (locale === "de" ? "ChatGPT" : "ChatGPT English") : slug,
  excerpt: `Short ${slug} excerpt`,
  metadata_json: JSON.stringify(locale === "de"
    ? { description: `Description for ${slug}`, tags: ["AI"], category: "KI" }
    : { description: `English description for ${slug}`, category: "KI" }),
  markdown: `# ${slug}\n\nA useful description for ${slug}.\n\n## Features\n\n- One feature`,
  source_hash: `${locale}-${slug}-hash`,
  revision: 1,
  source_published_at: "2026-08-01T00:00:00.000Z",
  source_updated_at: "2026-08-01T00:00:00.000Z",
  is_active: 1,
  route_state: "active",
  canonical_path: `${locale === "en" ? "/en" : ""}/tools/${slug}/`,
  redirect_target_path: null,
  robots_policy: "index,follow",
  googlebot_policy: null,
  editorial_reviewed: 1,
  illustration_path: null,
  asset_key: null,
  asset_hash: null,
  source_commit: "fixture",
  deleted_at: null,
  category: "KI",
  price_model: "Freemium",
  popularity: 0,
  collection_revision: 7,
  collection_updated_at: "2026-11-24 12:00:00",
  ...overrides,
});

let vite;
let buildRuntimeToolCatalog;
let prebuiltRuntimeToolCatalogResponse;
let runtimeToolCatalogETag;
let machineResponse;

before(async () => {
  vite = await createServer({
    root: siteRoot,
    configFile: false,
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });
  ({ buildRuntimeToolCatalog, prebuiltRuntimeToolCatalogResponse, runtimeToolCatalogETag, machineResponse } = await vite.ssrLoadModule("/runtime-src/lib/toolMachineRuntime.ts"));
});

after(async () => {
  await vite?.close();
});

test("catalog precompute preserves DE/EN merge, parity, item shape and retirement filtering", async () => {
  const policyHash = await getToolRoutePolicyHash();
  const snapshots = {
    de: { revision: 7, updatedAt: "2026-11-24 12:00:00", rows: [row("de", "chatgpt"), row("de", "xamarin")] },
    en: { revision: 7, updatedAt: "2026-11-24 12:00:00", rows: [row("en", "chatgpt"), row("en", "xamarin")] },
  };
  const catalogs = buildToolCatalogObjects({ snapshots, buildRuntimeToolCatalog, policyHash });
  const de = JSON.parse(catalogs.de.body);
  const en = JSON.parse(catalogs.en.body);
  assert.deepEqual(Object.keys(de), ["version", "site", "siteUrl", "generatedAt", "count", "items"]);
  assert.deepEqual(Object.keys(en), ["version", "site", "siteUrl", "language", "generatedAt", "count", "items"]);
  assert.equal(de.siteUrl, "https://tools.utildesk.de");
  assert.equal(en.siteUrl, "https://tools.utildesk.de/en/");
  assert.equal(en.language, "en");
  assert.equal(de.generatedAt, "2026-11-24 12:00:00");
  assert.deepEqual(de.items.map((item) => item.slug), ["chatgpt"]);
  assert.deepEqual(en.items.map((item) => item.slug), ["chatgpt"]);
  assert.equal(en.items[0].rawTags[0], "AI", "English catalog retains its German primary metadata merge");
  assert.equal(de.count, 1);
  assert.equal(en.count, 1);
  assert.match(catalogs.de.etag, /^W\/"tool-de-7-[a-f0-9]{64}"$/);
  assert.match(catalogs.en.etag, /^W\/"tool-en-7-de-7-[a-f0-9]{64}"$/);
  assert.equal(catalogs.en.primaryCollectionRevision, 7);
  assert.match(catalogs.de.objectKey, /^catalogs\/tool\/de\/[a-f0-9]{64}\.json$/);
  assert.equal(catalogs.de.contentHash.length, 64);
  assert.equal(catalogs.de.d1RowWouldOverflow, false);
});

test("catalog precompute rejects unpaired active locales and records JSON above D1 row limit for R2", async () => {
  const policyHash = await getToolRoutePolicyHash();
  assert.throws(() => buildToolCatalogObjects({
    policyHash,
    buildRuntimeToolCatalog,
    snapshots: {
      de: { revision: 1, updatedAt: "x", rows: [row("de", "chatgpt")] },
      en: { revision: 1, updatedAt: "x", rows: [] },
    },
  }), /not paired/);

  const hugeBuilder = (_entries, locale, generatedAt) => ({
    version: 1,
    site: "Utildesk",
    siteUrl: locale === "en" ? "https://tools.utildesk.de/en/" : "https://tools.utildesk.de/",
    ...(locale === "en" ? { language: "en" } : {}),
    generatedAt,
    count: 1,
    items: [{ slug: "chatgpt", description: "x".repeat(D1_MAX_ROW_BYTES + 100) }],
  });
  const large = buildToolCatalogObjects({
    policyHash,
    buildRuntimeToolCatalog: hugeBuilder,
    snapshots: {
      de: { revision: 1, updatedAt: "x", rows: [row("de", "chatgpt")] },
      en: { revision: 1, updatedAt: "x", rows: [row("en", "chatgpt")] },
    },
  });
  assert.ok(large.de.bytes > D1_MAX_ROW_BYTES);
  assert.equal(large.de.d1RowWouldOverflow, true);
  assert.ok(large.en.bytes > D1_MAX_ROW_BYTES);
});

test("manifest CAS atomically publishes both locales and rejects a stale concurrent snapshot", async () => {
  const migration = await readFile(new URL("../../runtime/migrations/0008_tool_catalog_objects.sql", import.meta.url), "utf8");
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(`CREATE TABLE runtime_collection_revisions (kind TEXT, locale TEXT, revision INTEGER, updated_at TEXT, PRIMARY KEY(kind, locale));\n${migration}`);
    db.prepare("UPDATE runtime_collection_revisions SET revision = CASE locale WHEN 'de' THEN 9 ELSE 8 END WHERE kind = 'tool'").run();
    const catalogs = {
      de: { revision: 9, primaryCollectionRevision: 9, objectKey: "catalogs/tool/de/de-hash.json", etag: 'W/"tool-de-9-de-hash"', generatedAt: "now", itemCount: 1, policyHash: "policy", contentHash: "de-hash" },
      en: { revision: 8, primaryCollectionRevision: 9, objectKey: "catalogs/tool/en/en-hash.json", etag: 'W/"tool-en-8-de-9-en-hash"', generatedAt: "now", itemCount: 1, policyHash: "policy", contentHash: "en-hash" },
    };
    const statement = buildToolCatalogManifestStatement(catalogs);
    const published = db.prepare(statement.sql).run(...statement.params);
    assert.equal(Number(published.changes), 2);
    assert.deepEqual(db.prepare("SELECT locale, object_key FROM runtime_tool_catalogs ORDER BY locale").all().map((item) => ({ ...item })), [
      { locale: "de", object_key: catalogs.de.objectKey },
      { locale: "en", object_key: catalogs.en.objectKey },
    ]);

    const beforeDeOnly = db.prepare(RUNTIME_TOOL_CATALOG_MANIFEST_SQL).get("en");
    assert.equal(beforeDeOnly.collection_revision, 8);
    assert.equal(beforeDeOnly.primary_collection_revision, 9);
    assert.equal(beforeDeOnly.object_key, catalogs.en.objectKey);

    db.prepare("UPDATE runtime_collection_revisions SET revision = 10 WHERE kind = 'tool' AND locale = 'de'").run();
    const duringDeOnly = db.prepare(RUNTIME_TOOL_CATALOG_MANIFEST_SQL).get("en");
    assert.equal(duringDeOnly.collection_revision, 8, "EN's own revision stays unchanged");
    assert.equal(duringDeOnly.primary_collection_revision, 10);
    assert.equal(duringDeOnly.object_key, null, "the EN object is unavailable immediately after a DE-only update");
    const stale = db.prepare(statement.sql).run(...statement.params);
    assert.equal(Number(stale.changes), 0);
    assert.deepEqual(db.prepare("SELECT locale, object_key FROM runtime_tool_catalogs ORDER BY locale").all().map((item) => ({ ...item })), [
      { locale: "de", object_key: catalogs.de.objectKey },
      { locale: "en", object_key: catalogs.en.objectKey },
    ]);
    const columns = db.prepare("PRAGMA table_info(runtime_tool_catalogs)").all().map((item) => item.name);
    assert.equal(columns.includes("body"), false, "full JSON stays outside D1's 2 MB row limit");
    assert.equal(columns.includes("primary_collection_revision"), true);

    const refreshed = {
      de: { ...catalogs.de, revision: 10, primaryCollectionRevision: 10, objectKey: "catalogs/tool/de/de-v2.json", contentHash: "de-v2" },
      en: { ...catalogs.en, primaryCollectionRevision: 10, objectKey: "catalogs/tool/en/en-v2.json", etag: 'W/"tool-en-8-de-10-en-v2"', contentHash: "en-v2" },
    };
    const refreshedStatement = buildToolCatalogManifestStatement(refreshed);
    assert.equal(Number(db.prepare(refreshedStatement.sql).run(...refreshedStatement.params).changes), 2);
    const afterRefresh = db.prepare(RUNTIME_TOOL_CATALOG_MANIFEST_SQL).get("en");
    assert.equal(afterRefresh.collection_revision, 8);
    assert.equal(afterRefresh.primary_collection_revision, 10);
    assert.equal(afterRefresh.etag, refreshed.en.etag);
    assert.equal(afterRefresh.object_key, refreshed.en.objectKey);
  } finally {
    db.close();
  }
});

test("runtime serves only a matching prebuilt R2 catalog and keeps the legacy fallback available", async () => {
  const policyHash = await getToolRoutePolicyHash();
  const body = JSON.stringify({ version: 1, count: 0, items: [] }, null, 2);
  const manifest = {
    collectionRevision: 7,
    primaryCollectionRevision: 7,
    updatedAt: "2026-11-24 12:00:00",
    objectKey: "catalogs/tool/de/hash.json",
    etag: 'W/"tool-de-7"',
    generatedAt: "2026-11-24 12:00:00",
    itemCount: 0,
    policyHash,
    contentHash: "hash",
  };
  let objectReads = 0;
  const bucket = { get: async (key) => {
    objectReads += 1;
    assert.equal(key, manifest.objectKey);
    return { body: new Response(body).body, size: Buffer.byteLength(body) };
  } };
  const response = await prebuiltRuntimeToolCatalogResponse(new Request("https://runtime.test/api/tools.json"), "de", manifest, bucket, policyHash);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("ETag"), manifest.etag);
  assert.equal(response.headers.get("X-Utildesk-Catalog-Ready"), "v1");
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex");
  assert.equal(await response.text(), body);

  const notModified = await prebuiltRuntimeToolCatalogResponse(
    new Request("https://runtime.test/api/tools.json", { headers: { "If-None-Match": manifest.etag } }),
    "de",
    manifest,
    bucket,
    policyHash,
  );
  assert.equal(notModified.status, 304);
  assert.equal(notModified.headers.get("ETag"), manifest.etag);
  assert.equal(await notModified.text(), "");
  assert.equal(objectReads, 2);

  assert.equal(await prebuiltRuntimeToolCatalogResponse(new Request("https://runtime.test/api/tools.json"), "de", manifest, bucket, "old-policy"), null);
  assert.equal(await prebuiltRuntimeToolCatalogResponse(new Request("https://runtime.test/api/tools.json"), "de", manifest, undefined, policyHash), null);
  assert.equal(await prebuiltRuntimeToolCatalogResponse(new Request("https://runtime.test/api/tools.json"), "de", { ...manifest, objectKey: null }, bucket, policyHash), null);
  assert.equal(await prebuiltRuntimeToolCatalogResponse(new Request("https://runtime.test/api/tools.json"), "de", manifest, { get: async () => { throw new Error("R2 read failure"); } }, policyHash), null,
    "an R2 outage selects the current dynamic D1 renderer instead of failing the catalog route");
});

test("DE-only changes invalidate EN prepared and fallback ETags without changing catalog order or 304 behavior", async () => {
  const policyHash = await getToolRoutePolicyHash();
  const deBefore = row("de", "chatgpt", {
    popularity: 10,
    metadata_json: JSON.stringify({ tags: ["AI"], category: "KI", editorial_verdict: "recommended", official_url: "https://old.example", image: "/old.webp" }),
    illustration_path: "/old.webp",
  });
  const en = row("en", "chatgpt");
  const common = {
    de: { revision: 9, updatedAt: "2026-11-24 09:00:00", rows: [deBefore, row("de", "ren-py", { title: "Ren-Py", source_published_at: "2026-01-01" })] },
    en: { revision: 8, updatedAt: "2026-11-24 08:00:00", rows: [en, row("en", "ren-py", { title: "Ren-Py" })] },
  };
  const before = buildToolCatalogObjects({ snapshots: common, buildRuntimeToolCatalog, policyHash });
  const beforePayload = JSON.parse(before.en.body);
  assert.deepEqual(beforePayload.items.map((item) => item.slug), ["chatgpt", "ren-py"]);
  assert.equal(beforePayload.items[0].popularity, 10);

  const deAfter = { ...deBefore, popularity: 11 };
  const after = buildToolCatalogObjects({
    snapshots: { ...common, de: { ...common.de, revision: 10, updatedAt: "2026-11-24 09:05:00", rows: [deAfter, common.de.rows[1]] } },
    buildRuntimeToolCatalog,
    policyHash,
  });
  const afterPayload = JSON.parse(after.en.body);
  assert.equal(after.en.revision, 8, "EN revision is unchanged");
  assert.equal(after.en.primaryCollectionRevision, 10);
  assert.equal(afterPayload.items[0].popularity, 11);
  assert.deepEqual(afterPayload.items.map((item) => item.slug), beforePayload.items.map((item) => item.slug), "precompute keeps the runtime's catalog item order");
  assert.notEqual(after.en.body, before.en.body);
  assert.notEqual(after.en.etag, before.en.etag);
  assert.equal(await runtimeToolCatalogETag("en", 8, 10, after.en.body), after.en.etag);
  assert.notEqual(await runtimeToolCatalogETag("en", 8, 9, after.en.body), after.en.etag);

  const manifest = {
    collectionRevision: after.en.revision,
    primaryCollectionRevision: after.en.primaryCollectionRevision,
    updatedAt: after.en.generatedAt,
    objectKey: after.en.objectKey,
    etag: after.en.etag,
    generatedAt: after.en.generatedAt,
    itemCount: after.en.itemCount,
    policyHash,
    contentHash: after.en.contentHash,
  };
  const bucket = { get: async () => ({ body: new Response(after.en.body).body, size: after.en.bytes }) };
  const staleConditional = await prebuiltRuntimeToolCatalogResponse(
    new Request("https://runtime.test/en/api/tools.json", { headers: { "If-None-Match": before.en.etag } }),
    "en", manifest, bucket, policyHash,
  );
  assert.equal(staleConditional.status, 200, "the old DE-dependent validator must not produce a false 304");
  assert.equal(JSON.parse(await staleConditional.text()).items[0].popularity, 11);
  const freshConditional = await prebuiltRuntimeToolCatalogResponse(
    new Request("https://runtime.test/en/api/tools.json", { headers: { "If-None-Match": after.en.etag } }),
    "en", manifest, bucket, policyHash,
  );
  assert.equal(freshConditional.status, 304);
  assert.equal(await freshConditional.text(), "");

  const fallbackBody = JSON.stringify(afterPayload, null, 2);
  const fallbackEtag = await runtimeToolCatalogETag("en", 8, 10, fallbackBody);
  assert.equal(fallbackEtag, after.en.etag);
  assert.equal(machineResponse(new Request("https://runtime.test/en/api/tools.json", { headers: { "If-None-Match": before.en.etag } }), fallbackBody, "application/json", fallbackEtag).status, 200);
  assert.equal(machineResponse(new Request("https://runtime.test/en/api/tools.json", { headers: { "If-None-Match": fallbackEtag } }), fallbackBody, "application/json", fallbackEtag).status, 304);
});
