# sheet_seed_from_alternatives.mjs

## Purpose

Seeds Google Sheet with NEW rows from alternatives audit missing matches.

Reads the alternatives audit JSON (`/tmp/audit_alternatives_render_v2.json`), extracts tools mentioned in alternatives sections but not found in the content/tools directory, and adds them to the Sheet with status=NEW and notes=ALT_SEED.

## Usage

```bash
# Dry-run (default, no writes)
node scripts/sheet_seed_from_alternatives.mjs --dry-run --limit 20

# Apply (write to Sheet)
node scripts/sheet_seed_from_alternatives.mjs --apply --limit 20

# JSON output
node scripts/sheet_seed_from_alternatives.mjs --json --limit 50
```

## Flags

- `--dry-run`: Default mode, no writes. Shows summary and sample rows.
- `--apply`: Write NEW rows to Sheet.
- `--limit N`: Maximum rows to add (default: 20).
- `--json`: Output JSON instead of human-readable summary.

## Deduplication Logic

1. **By slug**: Deduplicates candidates within the same run by slugified topic.
2. **Sheet check**: Skips if topic (lowercase) or slug already exists in Sheet.
3. **File check**: Skips if `content/tools/<slug>.md` already exists.
4. **Host check**: Currently not implemented (can be added if needed).

## Output Row Format

Each row written to Sheet (16 columns A-P):
- A: topic (from alternatives detail)
- B: slug (slugified topic)
- C: category (auto-detected fallback)
- D-F: empty (tags, price_model, affiliate_url)
- G: status = "NEW"
- H: notes = "ALT_SEED"
- I-P: empty (title, short_hint, official_url, wikidata fields)

## Summary Structure

```json
{
  "total_candidates": 400,
  "dedup_skipped": 0,
  "already_in_sheet": 2,
  "already_has_file": 0,
  "to_add": 5,
  "written": 5,
  "errors": []
}
```

## Production Usage

Invoked by cron:
```bash
flock -n /tmp/utildesk-motia_alternatives.lock bash -lc \
  'cd /opt/utildesk-motia && \
   node scripts/audit_alternatives_render.mjs --json > /tmp/audit_alternatives_render_v2.json && \
   node scripts/sheet_seed_from_alternatives.mjs --apply --limit 20' \
  >> /var/log/utildesk-motia/alternatives.log 2>&1
```

Schedule: `10 2 * * *` (daily at 02:10 UTC)

## Environment Variables

- `SPREADSHEET_ID`: Google Sheet ID (required)
- `SHEET_NAME`: Sheet tab name (default: "Tabellenblatt1")
- `GOOGLE_CLIENT_EMAIL`: Service account email (required)
- `GOOGLE_PRIVATE_KEY`: Service account private key (required)
- `AUDIT_ALTERNATIVES_JSON`: Path to audit JSON (default: `/tmp/audit_alternatives_render_v2.json`)

## Safety

- **Dry-run by default**: Requires explicit `--apply` flag.
- **Limit enforced**: Maximum 20 rows per run (configurable).
- **No destructive operations**: Only appends NEW rows, never updates or deletes.
- **Deduplication**: Prevents adding duplicates.
- **Structured logging**: JSON summary for easy monitoring.

## Related Scripts

- `audit_alternatives_render.mjs`: Generates the source JSON.
- `sheet_write_rows_strict_AP_v2.mjs`: Low-level writer (called by this script).
- `sheet_ai_autogen_9_strict_v2.mjs`: Processes NEW rows.
