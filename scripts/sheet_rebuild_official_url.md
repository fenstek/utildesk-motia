# sheet_rebuild_official_url

Rebuilds `official_url` suggestions for sheet rows filtered by status.

## Defaults

- dry-run by default (no writes)
- default status filter: `REBUILD`

## Usage

- Dry-run NEEDS_REVIEW:
  - `node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --use-gpt --limit 20 --json`

- Apply NEEDS_REVIEW:
  - `node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --use-gpt --apply --limit 20`
