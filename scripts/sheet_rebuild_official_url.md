# sheet_rebuild_official_url

`scripts/sheet_rebuild_official_url.mjs` rebuilds `official_url` suggestions for rows filtered by status.

## Defaults

- Dry-run by default (no writes).
- Default status filter: `REBUILD`.
- Default limit: `10`.

## Options

- `--status <NAME>`: process only rows with this status (case-insensitive).
- `--limit <N>`: maximum rows to inspect.
- `--json`: print JSON output.
- `--apply`: write suggested `official_url` and set status to `NEW`.
- `--help`: show usage and exit without requiring env vars.

## Examples

- Dry-run NEEDS_REVIEW:
  - `node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --limit 20 --json`

- Apply NEEDS_REVIEW:
  - `node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --apply --limit 20`
