# Check Stuck IN_PROGRESS

## Purpose
Diagnostic script to identify tools stuck in IN_PROGRESS status in Google Sheets.

## Usage
```bash
node scripts/check_stuck_in_progress.mjs
```

## Output
- Total number of rows in sheet
- Count of IN_PROGRESS rows
- For each IN_PROGRESS row:
  - Row number
  - Slug
  - Title
  - Whether the markdown file exists locally

## When to Use
- After cron failures or interruptions
- To audit publish pipeline health
- Before manual intervention on stuck rows

## Related Scripts
- `sheet_set_status.mjs` - Reset status to NEW/DONE/ERROR
- `test_run_9_full.mjs --finalize-deferred` - Complete deferred status updates

## Common Issues

### IN_PROGRESS with no MD file
**Cause**: Generation failed or was interrupted before file creation.
**Fix**: Reset to NEW using `node scripts/sheet_set_status.mjs <row> NEW`

### IN_PROGRESS with MD file exists
**Cause**: File was generated but commit/push failed (e.g., blocked by allowlist).
**Fix**: Check git status, commit the file, then run finalize-deferred.

## See Also
- `cron_publish_push.sh` - Main publish wrapper with allowlist check (line 67)
- `.gitignore` - Patterns for audit output files
