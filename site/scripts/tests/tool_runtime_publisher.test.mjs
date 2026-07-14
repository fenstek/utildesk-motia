import assert from "node:assert/strict";
import test from "node:test";
import {
  assertProductionSafety,
  buildRouteStateBatch,
  buildUpsertBatch,
  executeD1Batch,
  reconcileToolState,
  toolAssetsForEntries,
} from "../lib/tool-runtime-publisher.mjs";

const fakeEntry = (slug, locale, sourceHash = `${slug}-${locale}`) => ({
  contentKey: `tool:${locale}:${slug}`,
  kind: "tool",
  locale,
  slug,
  title: slug,
  excerpt: "excerpt",
  metadata: { slug },
  markdown: "body",
  sourceHash,
  sourcePublishedAt: null,
  sourceUpdatedAt: null,
  isActive: 1,
  routeState: "active",
  canonicalPath: `${locale === "en" ? "/en" : ""}/tools/${slug}/`,
  robotsPolicy: "index,follow",
  googlebotPolicy: null,
  editorialReviewed: 1,
  illustrationPath: null,
  assetKey: null,
  assetHash: null,
  sourceCommit: "deadbeef",
  deletedAt: null,
  category: "Test",
  priceModel: "Free",
  popularity: 0,
});

test("100 paired tools fit in one 50-statement D1 transaction", () => {
  const entries = Array.from({ length: 100 }, (_, index) => {
    const slug = `tool-${index}`;
    return [fakeEntry(slug, "de"), fakeEntry(slug, "en")];
  }).flat();
  const statements = buildUpsertBatch(entries);
  assert.equal(statements.length, 50);
  assert.equal(Math.max(...statements.map((statement) => statement.params.length)), 100);
  assert.ok(statements.every((statement) => statement.params.length <= 100));
});

test("D1 batch is sent in one authenticated request without embedding the token in its body", async () => {
  let request;
  const fetchImpl = async (url, init) => {
    request = { url, init };
    return { ok: true, status: 200, json: async () => ({ success: true, result: [{ success: true }] }) };
  };
  await executeD1Batch({
    accountId: "account",
    databaseId: "database",
    token: "secret-token",
    statements: [{ sql: "SELECT 1", params: [] }],
    fetchImpl,
  });
  assert.equal(JSON.parse(request.init.body).batch.length, 1);
  assert.equal(request.init.headers.Authorization, "Bearer secret-token");
  assert.equal(request.init.body.includes("secret-token"), false);
});

test("D1 batch failure is a hard stop", async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ success: false, errors: [{ code: 7500, message: "rolled back" }] }),
  });
  await assert.rejects(
    executeD1Batch({ accountId: "a", databaseId: "d", token: "t", statements: [{ sql: "bad", params: [] }], fetchImpl }),
    /rolled back/,
  );
});

test("asset plan is empty for entries without illustrations", () => {
  assert.deepEqual(toolAssetsForEntries([fakeEntry("alpha", "de"), fakeEntry("alpha", "en")]), []);
});

test("route-state operations never emit physical deletes", () => {
  const disabled = buildRouteStateBatch("deactivate", ["old-tool"], { sourceCommit: "deadbeef" });
  const tombstone = buildRouteStateBatch("tombstone", ["old-tool"], { sourceCommit: "deadbeef" });
  const redirect = buildRouteStateBatch("redirect", ["old-tool"], {
    sourceCommit: "deadbeef",
    redirects: new Map([["old-tool", "new-tool"]]),
  });
  for (const statement of [...disabled, ...tombstone, ...redirect]) {
    assert.doesNotMatch(statement.sql, /\bDELETE\b/i);
  }
  assert.match(redirect[0].sql, /route_state = 'redirect'/);
});

test("reconcile reports route, source and asset drift classes", () => {
  const expected = [fakeEntry("alpha", "de", "a-de"), fakeEntry("alpha", "en", "a-en"), fakeEntry("beta", "de", "b-de")];
  const actual = [
    { locale: "de", slug: "alpha", is_active: 1, route_state: "active", source_hash: "wrong" },
    { locale: "en", slug: "alpha", is_active: 0, route_state: "disabled", source_hash: "a-en" },
    { locale: "de", slug: "extra", is_active: 1, route_state: "active", source_hash: "extra" },
  ];
  assert.deepEqual(reconcileToolState(expected, actual), {
    ok: false,
    missing: ["de:beta"],
    extraActive: ["de:extra"],
    inactiveExpected: ["en:alpha"],
    hashMismatch: ["de:alpha"],
    assetHashMismatch: [],
  });
});

test("production safety rejects dirty source before any request", () => {
  assert.throws(() => assertProductionSafety({
    production: true,
    remote: true,
    confirmation: "TOOL_RUNTIME_PRODUCTION",
    backupPath: import.meta.filename,
    releaseState: { clean: false, dirtyPaths: ["content/tools/a.md"] },
    databaseName: "utildesk-content-runtime-production",
  }), /clean release commit/);
});
