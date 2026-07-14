-- Materialized delivery state for safe tool runtime routing.
-- Git Markdown remains the source of truth; these columns are a production projection.
ALTER TABLE content_entries ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1));
ALTER TABLE content_entries ADD COLUMN route_state TEXT NOT NULL DEFAULT 'active'
  CHECK (route_state IN ('active', 'redirect', 'disabled', 'tombstone'));
ALTER TABLE content_entries ADD COLUMN canonical_path TEXT NOT NULL DEFAULT '';
ALTER TABLE content_entries ADD COLUMN robots_policy TEXT NOT NULL DEFAULT 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
ALTER TABLE content_entries ADD COLUMN googlebot_policy TEXT;
ALTER TABLE content_entries ADD COLUMN editorial_reviewed INTEGER NOT NULL DEFAULT 0
  CHECK (editorial_reviewed IN (0, 1));
ALTER TABLE content_entries ADD COLUMN illustration_path TEXT;
ALTER TABLE content_entries ADD COLUMN source_commit TEXT;
ALTER TABLE content_entries ADD COLUMN deleted_at TEXT;
ALTER TABLE content_entries ADD COLUMN category TEXT;
ALTER TABLE content_entries ADD COLUMN price_model TEXT;
ALTER TABLE content_entries ADD COLUMN popularity REAL NOT NULL DEFAULT 0;

UPDATE content_entries
SET canonical_path = CASE
  WHEN locale = 'en' THEN '/en/' || kind || CASE WHEN kind = 'tool' THEN 's/' ELSE '/' END || slug || '/'
  ELSE '/' || kind || CASE WHEN kind = 'tool' THEN 's/' ELSE '/' END || slug || '/'
END
WHERE canonical_path = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_entries_canonical_path
  ON content_entries (canonical_path);

CREATE INDEX IF NOT EXISTS idx_content_entries_public_lookup
  ON content_entries (kind, locale, is_active, slug);

CREATE INDEX IF NOT EXISTS idx_content_entries_tool_index
  ON content_entries (kind, locale, is_active, editorial_reviewed, popularity DESC, title);

CREATE INDEX IF NOT EXISTS idx_content_entries_tool_category
  ON content_entries (kind, locale, is_active, category, title);

CREATE INDEX IF NOT EXISTS idx_content_entries_route_state
  ON content_entries (kind, route_state, locale, slug);
