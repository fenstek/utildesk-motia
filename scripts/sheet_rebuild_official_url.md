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
- `--trace-gpt`: include `gpt_trace` object in each row (mode/model/prompt hash/raw reply snippet/parse errors).
- `--strict`: suggest URL only when validation passes (`ok=true`, `score>=minScore`, domain not forbidden).
- `--min-score <N>`: minimum validation score for suggestion (default: `3`).
- `--dry-validate-only`: keep `suggested_official_url` empty and output validation details only.

- Dry-run:
  - `bash -lc 'set -a; source /opt/utildesk-motia/.env; set +a; SHEET_NAME=Tabellenblatt1 node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --use-gpt --gpt-fallback --trace-gpt --strict --limit 20 --json'`

- Apply:
  - `bash -lc 'set -a; source /opt/utildesk-motia/.env; set +a; SHEET_NAME=Tabellenblatt1 node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --use-gpt --gpt-fallback --strict --apply --limit 20'`

## Forbidden Domains

DuckDuckGo redirect URLs (`duckduckgo.com`) are hard-rejected:
- Marked as `forbidden=true` with notes `forbidden_domain,ddg_redirect_forbidden`
- Never selected as `suggested_official_url`, even in non-strict mode
- This prevents suggesting search engine redirect URLs instead of actual product sites

Other forbidden domains include: Wikipedia, GitHub, review sites (G2, Capterra, AlternativeTo, Product Hunt), and social media platforms.

## Token Boundary Self-check

Use boundary matching for brand tokens (prevents false positives like `domo` -> `domodedovo`):

```bash
node -e 'const m=(h,t)=>new RegExp(`(^|[^a-z0-9])${t}([^a-z0-9]|$)`).test(h.toLowerCase()); console.log({domo_vs_domodedovo:m(\"www.domodedovo.ru\",\"domo\"), domo_vs_domo:m(\"domo.com\",\"domo\"), pipe_vs_pipedream:m(\"pipedream.com\",\"pipe\")});'
```

Expected:
- `domo_vs_domodedovo: false`
- `domo_vs_domo: true`
