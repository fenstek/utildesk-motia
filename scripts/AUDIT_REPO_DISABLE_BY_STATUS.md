# AUDIT_REPO_DISABLE_BY_STATUS.md

Disables published tool markdown files when their Sheet status is not publishable.

## Purpose

Prevent recurrence of cases like `telescope`: if a tool is in `NEEDS_REVIEW`,
`ERROR`, or `BLACKLIST` in the Sheet, its repo page should be disabled
(`content/tools/_slug.md`) instead of remaining publishable.

This script bridges Sheet state and repo state.

## Script

`scripts/audit_repo_disable_by_sheet_status.mjs`

## Rules

- Reads `slug` + `status` from Sheet (`Tabellenblatt1`)
- Scans repo `content/tools/*.md` (excluding `_*.md`)
- For each active file:
  - if Sheet status in `{ NEEDS_REVIEW, ERROR, BLACKLIST }`
    - dry-run: records `planned_rename`
    - apply: renames `content/tools/slug.md` -> `content/tools/_slug.md`

## Usage

```bash
# Dry-run (default)
node scripts/audit_repo_disable_by_sheet_status.mjs --json

# Apply renames
node scripts/audit_repo_disable_by_sheet_status.mjs --apply=1 --json
```

## JSON Report

- `scanned_files`
- `matched_in_sheet`
- `planned_disable_count`
- `disabled_count`
- `samples` (up to 20)
- `mode` (`dry-run` / `apply`)

## Notes

- Files already disabled (`_slug.md`) are not scanned.
- No Sheet rows are modified by this script.
- Safe default: dry-run unless `--apply=1`.
