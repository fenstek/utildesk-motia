# sheet_fix_stuck_in_progress_4rows

## Purpose

One-time repair script to fix exactly 4 rows (90, 95, 105, 107) that are stuck in `IN_PROGRESS` status in the Google Sheet.

The script:
1. Reads the specified rows from the sheet
2. Checks if corresponding markdown files exist in `content/tools/<slug>.md`
3. Updates status and notes based on file presence:
   - **If markdown exists** → set status to `DONE`
   - **If markdown missing** → set status to `ERROR` and append note: `AUTO_FIX: missing MD in repo`

## Safety

- Only touches rows 90, 95, 105, 107 (hardcoded)
- Does NOT modify any other rows
- Updates only `status` and `notes` columns
- Supports dry-run mode to preview changes before applying

## Usage

### Dry-run (preview changes without writing)

```bash
node scripts/sheet_fix_stuck_in_progress_4rows.mjs --dry-run
```

Output: JSON showing planned changes for each row

### Apply changes

```bash
node scripts/sheet_fix_stuck_in_progress_4rows.mjs --apply
```

Writes status and notes updates to Google Sheet.

## Requirements

- Google service account credentials at `/opt/utildesk-motia/secrets/google-service-account.json`
- Read/write access to the spreadsheet

## What It Changes

For each target row (90, 95, 105, 107):

| Row | Slug | MD Exists? | New Status | Notes Update |
|-----|------|------------|------------|--------------|
| 90 | descript | Yes | DONE | (unchanged) |
| 95 | piktochart | No | ERROR | Appends: `AUTO_FIX: missing MD in repo` |
| 105 | murf | Yes | DONE | (unchanged) |
| 107 | tidio | Yes | DONE | (unchanged) |

## Example Output (Dry-run)

```json
{
  "mode": "DRY-RUN",
  "changes": [
    {
      "rowNumber": 90,
      "slug": "descript",
      "currentStatus": "IN_PROGRESS",
      "newStatus": "DONE",
      "mdExists": true,
      "statusCell": "Tabellenblatt1!G90",
      "notesCell": "Tabellenblatt1!I90",
      "currentNotes": "...",
      "newNotes": "..."
    }
  ]
}
```

## Notes

- This is a targeted one-time fix script
- After running with `--apply`, the rows will be unblocked and the autogen pipeline can proceed
- Row 95 (piktochart) will be marked ERROR since the markdown file was never generated
