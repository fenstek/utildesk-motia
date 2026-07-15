-- Keep a route's own canonical path unique and store redirect destinations separately.
-- This permits multiple historical aliases to redirect to one active canonical tool.
ALTER TABLE content_entries ADD COLUMN redirect_target_path TEXT;

CREATE INDEX IF NOT EXISTS idx_content_entries_redirect_target
  ON content_entries (kind, locale, route_state, redirect_target_path);
