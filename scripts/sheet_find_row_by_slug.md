# sheet_find_row_by_slug

Find a Google Sheet row by slug and print its details as JSON.

## Purpose

Looks up a row in the configured Google Sheet by the `slug` column value
and returns the row index (1-based spreadsheet row number), slug, official_url,
topic, and status as a JSON object.

## Requirements

Environment variables (loaded via `.env` or exported in shell):

| Variable              | Required | Description                               |
|-----------------------|----------|-------------------------------------------|
| `SPREADSHEET_ID`      | yes      | Google Sheets document ID                 |
| `SHEET_NAME`          | no       | Sheet tab name (default: `Tabellenblatt1`) |
| `GOOGLE_CLIENT_EMAIL` | yes      | Service account email                     |
| `GOOGLE_PRIVATE_KEY`  | yes      | Service account private key               |

## CLI

```
node scripts/sheet_find_row_by_slug.mjs <slug>
```

## Output JSON

```json
{
  "ok": true,
  "row_index": 42,
  "slug": "kive",
  "topic": "Kive",
  "official_url": "https://kive.com/",
  "status": "DONE"
}
```

On failure:

```json
{ "ok": false, "slug": "kive", "error": "slug not found" }
```

## Examples

```bash
# With dotenv loaded automatically
node scripts/sheet_find_row_by_slug.mjs kive

# With explicit env vars
SPREADSHEET_ID=1abc... GOOGLE_CLIENT_EMAIL=sa@proj.iam.gserviceaccount.com \
  GOOGLE_PRIVATE_KEY="-----BEGIN RSA..." \
  node scripts/sheet_find_row_by_slug.mjs kive
```
