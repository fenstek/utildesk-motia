import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { buildEntryUpsertStatement } from "../runtime-content.mjs";

const schema = `
  CREATE TABLE content_entries (
    content_key TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    locale TEXT NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    metadata_json TEXT NOT NULL,
    markdown TEXT NOT NULL,
    source_hash TEXT NOT NULL,
    source_published_at TEXT,
    source_updated_at TEXT,
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER NOT NULL DEFAULT 1,
    route_state TEXT NOT NULL DEFAULT 'active',
    canonical_path TEXT NOT NULL DEFAULT '',
    robots_policy TEXT NOT NULL DEFAULT '',
    googlebot_policy TEXT,
    editorial_reviewed INTEGER NOT NULL DEFAULT 0,
    illustration_path TEXT,
    asset_key TEXT,
    asset_hash TEXT,
    source_commit TEXT,
    deleted_at TEXT,
    category TEXT,
    price_model TEXT,
    popularity REAL NOT NULL DEFAULT 0,
    redirect_target_path TEXT,
    UNIQUE (kind, locale, slug)
  );
`;

const entry = (editorialReviewed) => ({
  contentKey: "ratgeber:de:example",
  kind: "ratgeber",
  locale: "de",
  slug: "example",
  title: "Example",
  excerpt: "Example excerpt",
  metadata: { slug: "example" },
  markdown: "# Example",
  sourceHash: "same-source",
  sourcePublishedAt: "2026-08-01T00:00:00.000Z",
  sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
  isActive: 1,
  routeState: "active",
  canonicalPath: "/ratgeber/example/",
  robotsPolicy: "index,follow",
  googlebotPolicy: null,
  editorialReviewed,
  illustrationPath: null,
  assetKey: null,
  assetHash: null,
  sourceCommit: null,
  deletedAt: null,
  category: null,
  priceModel: null,
  popularity: 0,
});

test("editorial_reviewed-only changes update the row and increment revision", () => {
  const database = new DatabaseSync(":memory:");
  try {
    database.exec(schema);
    const initial = buildEntryUpsertStatement(entry(0));
    const reviewed = buildEntryUpsertStatement(entry(1));
    const statement = database.prepare(initial.sql);

    statement.run(...initial.params);
    const result = database.prepare(reviewed.sql).run(...reviewed.params);
    const row = database.prepare(
      "SELECT editorial_reviewed, revision FROM content_entries WHERE kind = 'ratgeber' AND locale = 'de' AND slug = 'example'",
    ).get();

    assert.equal(Number(result.changes), 1);
    assert.deepEqual({ ...row }, { editorial_reviewed: 1, revision: 2 });
  } finally {
    database.close();
  }
});
