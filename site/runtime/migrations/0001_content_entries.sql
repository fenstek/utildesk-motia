-- Runtime content projection. Git and the Google Sheet remain editorial sources of truth;
-- this table is the read model used by Worker-rendered pages.
CREATE TABLE IF NOT EXISTS content_entries (
  content_key TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('tool', 'ratgeber')),
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
  UNIQUE (kind, locale, slug)
);

CREATE INDEX IF NOT EXISTS idx_content_entries_lookup
  ON content_entries (kind, locale, slug);

CREATE INDEX IF NOT EXISTS idx_content_entries_locale_kind_updated
  ON content_entries (locale, kind, source_updated_at DESC);
