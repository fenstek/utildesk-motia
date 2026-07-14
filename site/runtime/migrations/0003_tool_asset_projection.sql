-- Content-addressed tool assets. Objects are uploaded before the D1 pointer changes.
ALTER TABLE content_entries ADD COLUMN asset_key TEXT;
ALTER TABLE content_entries ADD COLUMN asset_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_content_entries_tool_asset
  ON content_entries (kind, asset_hash, asset_key)
  WHERE asset_hash IS NOT NULL;
