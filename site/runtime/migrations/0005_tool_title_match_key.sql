ALTER TABLE content_entries ADD COLUMN title_match_key TEXT GENERATED ALWAYS AS (
  trim(replace(replace(replace(replace(
    replace(replace(replace(replace(
      ' ' || lower(trim(CASE
        WHEN instr(title, '(') > 0 THEN substr(title, 1, instr(title, '(') - 1)
        ELSE title
      END)) || ' ',
      ' ai ', ' '), ' tool ', ' '), ' app ', ' '), ' platform ', ' '),
    '  ', ' '), '  ', ' '), '  ', ' '), '  ', ' '))
) VIRTUAL;

CREATE INDEX IF NOT EXISTS idx_content_entries_tool_title_match
  ON content_entries(kind, locale, is_active, route_state, title_match_key);
