# sheet_rebuild_official_url

Rebuilds `official_url` suggestions for sheet rows filtered by status.

## Defaults

- dry-run by default (no writes)
- default status filter: `REBUILD`
- `--gpt-fallback-n` default: `5` (max `8`)
- `--validate-timeout-ms` default: `8000`
- `--sleep-ms` default: `400`

## Usage

- Dry-run NEEDS_REVIEW:
  - `node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --limit 20 --json`

- Apply NEEDS_REVIEW:
  - `node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --apply --limit 20`

## GPT fallback mode

- `--use-gpt`: use GPT chooser when candidates exist.
- `--gpt-fallback`: if candidates are empty, ask GPT to generate URL options and validate them.
- `--gpt-fallback-n <N>`: number of GPT-generated candidates to validate.
- `--dry-validate-only`: keep `suggested_official_url` empty and output validation details only.

- Dry-run:
  - `bash -lc 'set -a; source /opt/utildesk-motia/.env; set +a; SHEET_NAME=Tabellenblatt1 node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --use-gpt --gpt-fallback --limit 20 --json'`

- Apply:
  - `bash -lc 'set -a; source /opt/utildesk-motia/.env; set +a; SHEET_NAME=Tabellenblatt1 node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --use-gpt --gpt-fallback --apply --limit 20'`
