CREATE INDEX IF NOT EXISTS idx_content_entries_tool_active_slug
  ON content_entries(kind, locale, is_active, route_state, slug);

CREATE INDEX IF NOT EXISTS idx_content_entries_tool_active_lower_title
  ON content_entries(
    kind, locale, is_active, route_state, lower(title)
  );
