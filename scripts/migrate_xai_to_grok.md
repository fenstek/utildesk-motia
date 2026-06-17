# migrate_xai_to_grok.mjs

## Purpose
One-time safe migration in Google Sheet:
- Find row with `slug == "x-ai"` (company entity).
- Mark it as `BLACKLIST` and append migration note.
- Ensure tool row `slug == "grok"` exists (append if missing).

This script is idempotent:
- If `grok` already exists, no new row is appended.
- If `x-ai` is already `BLACKLIST`, only missing note can be appended.
- If both are already in expected state, script exits with no-op.

## Usage
```bash
node scripts/migrate_xai_to_grok.mjs --dry-run
node scripts/migrate_xai_to_grok.mjs
```

## Options
- `--dry-run`:
  - Print planned mutations only.
  - Do not write to Google Sheet.

## Expected Output
JSON report with:
- matched row numbers for `x-ai` and `grok`
- planned/applied updates for `status` and `notes`
- whether Grok row append is required
- no-op message when nothing must be changed

## Notes
- Uses the same Sheets auth pattern as project scripts:
  - env JWT (`GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY`) or
  - fallback service account file at `/opt/utildesk-motia/secrets/google-service-account.json`.
