# sheet_set_official_url

Update the `official_url` column for a specific row in Google Sheet.

## Purpose

Writes a new value into the `official_url` cell for a given row index,
then reads it back to confirm the update. Outputs JSON before and after.

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
node scripts/sheet_set_official_url.mjs <row_index> <official_url>
```

| Argument       | Description                                            |
|----------------|--------------------------------------------------------|
| `row_index`    | 1-based spreadsheet row number (row 1 = header)        |
| `official_url` | New URL value, must start with `http`                  |

## Output JSON

Before update:
```json
{"row_index": 42, "url_before": "https://kive.com/", "url_after": "https://kive.ai/"}
```

After confirmed write:
```json
{"ok": true, "row_index": 42, "url_before": "https://kive.com/", "official_url": "https://kive.ai/"}
```

## Examples

```bash
# Fix kive official_url (row 42 is an example — use actual row from sheet_find_row_by_slug)
node scripts/sheet_set_official_url.mjs 42 https://kive.ai/

# Typical workflow:
#   1. Find row:   node scripts/sheet_find_row_by_slug.mjs kive
#   2. Set URL:    node scripts/sheet_set_official_url.mjs <row_index> https://kive.ai/
```
