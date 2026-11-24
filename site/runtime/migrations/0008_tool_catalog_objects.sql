-- A compact pointer to precomputed public tool catalogs in the existing R2
-- TOOL_ASSETS bucket. The JSON itself can exceed D1's 2,000,000-byte row cap.
CREATE TABLE IF NOT EXISTS runtime_tool_catalogs (
  locale TEXT PRIMARY KEY CHECK (locale IN ('de', 'en')),
  collection_revision INTEGER NOT NULL,
  primary_collection_revision INTEGER NOT NULL,
  object_key TEXT NOT NULL,
  etag TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  item_count INTEGER NOT NULL CHECK (item_count >= 0),
  policy_hash TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO runtime_collection_revisions (kind, locale, revision)
VALUES ('tool', 'de', 1), ('tool', 'en', 1);
