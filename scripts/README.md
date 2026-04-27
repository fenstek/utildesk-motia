# Scripts Overview

## Core Automation Scripts

### sheet_seed_from_alternatives.mjs
Seeds Google Sheet with NEW rows from alternatives audit missing matches. See [sheet_seed_from_alternatives.md](./sheet_seed_from_alternatives.md) for details.

### sheet_rebuild_official_url.mjs
Rebuilds official_url for rows with specified status (typically NEEDS_REVIEW). Uses DDG + GPT validation.

### sheet_ai_autogen_9_strict_v2.mjs
Main autopilot: processes NEW rows, generates content, creates markdown files.

### translate_tools_to_english_codex.mjs
Primary English localization backfill for `content/tools/*.md`. Uses the local Codex CLI OAuth session (`codex exec`), not Cloudflare AI and not `OPENAI_API_KEY`.

Useful commands:
- `npm run translate:tools:en -- --dry-run --limit=10`
- `npm run translate:tools:en -- --limit=25`
- `npm run translate:tools:en -- --slugs=twilio,tpot,libreoffice-impress`
- `npm run translate:tools:en -- --force --slug=twilio`

Environment:
- `CODEX_TRANSLATION_MODEL` optional; empty uses the current Codex default model.
- `CODEX_TRANSLATION_CONCURRENCY=1` is the safe default because each item runs a separate `codex exec` process.
- `TRANSLATE_LIMIT`, `TRANSLATE_SLUGS`, and `TRANSLATE_LOG_PATH` are supported for batch control.
- `CODEX_CLI_PATH` is optional; on Windows the script auto-resolves the installed Codex CLI JS entrypoint to avoid PowerShell shim issues.

The old `translate_tools_to_english_cf_ai.mjs` script is legacy fallback only. Do not use it for production translations unless Codex OAuth is unavailable and the Cloudflare Workers AI quota is intentionally approved.

### audit_alternatives_render.mjs
Audits alternatives sections in existing tools, generates JSON report of missing tools.

### enrich_tags_and_validate_category.mjs
Enriches generic tags via GPT and validates category matching to prevent tools from being published without proper categorization. See [enrich_tags_and_validate_category.md](./enrich_tags_and_validate_category.md) for details.

---

## GPT Tag Enrichment & Category Validation

### Purpose
Prevents tools from being published without proper category matching by enriching generic tags (e.g., only `["ai"]`) with specific tags from allowlist and validating category match.

### Behavior
- Checks if tags are generic (empty or only "ai")
- If generic AND `USE_GPT_TAG_ENRICH=1`: calls GPT to add 1-4 specific tags from allowlist
- Validates that final tags match at least one category (same logic as website)
- Marks tool as NEEDS_REVIEW if:
  - Tag enrichment fails
  - No category matches even after enrichment

### Environment Variables
- `USE_GPT_TAG_ENRICH` (default: off) - Enable GPT tag enrichment
- `OPENAI_API_KEY` - Required if GPT enrichment enabled
- `GPT_TAG_MODEL` (default: `gpt-4o-mini`)
- `GPT_TAG_TIMEOUT_MS` (default: `15000`)

### Integration
Can be integrated into autogen pipeline BEFORE setting tool status to NEW/DONE. If enrichment/validation fails, tool is marked as NEEDS_REVIEW with appropriate notes.

---

## GPT Official URL Fallback

### Purpose
Optional GPT-based chooser for `official_url` as fallback when deterministic URL resolution is uncertain.

## Behavior
- Primary signal: Wikidata `P856` with high confidence.
- Deterministic fallback: DDG resolver produces ranked `candidates[]` (canonicalized, deduplicated, blacklist-filtered).
- Integration point: `scripts/sheet_ai_autogen_9_strict_v2.mjs` in `resolveOfficialForTopic(...)`.
- Optional GPT fallback runs only when:
  - `USE_GPT_URL` is truthy, and
  - `candidates.length > 1` OR low-confidence fallback.
- Low-confidence fallback means:
  - `official_url` is empty, OR
  - `confidence < OFFICIAL_URL_MIN_CONF`.
- GPT may choose only from provided candidates (strict allowlist).
- On GPT error/invalid output/low confidence, pipeline does not fail and keeps deterministic fallback behavior.
- Hard aliases: `mitsuku->kuki`, `pytorch-lightning->pytorch`, `google-bard->gemini`, `openai-whisper->whisper`, `runway-ml->runway`, `runwayml->runway`, `runway-ai->runway`, `jasper-ai->jasper`, `jarvis->jasper` (skipped if canonical exists).
- Hard reject slugs: `this-person-does-not-exist` (never added to NEW and skipped before IN_PROGRESS).
- For tokens <= 4: match only if first label == token OR first label has boundary token- / -token; no includes(token). For tokens >= 5 keep previous behavior.

## Environment Variables
- `USE_GPT_URL` (default: off)
- `OFFICIAL_URL_TOPN` (default: `8`)
- `OFFICIAL_URL_MIN_CONF` (default: `0.85`)
- `GPT_URL_MODEL` (default: `gpt-4o-mini`)
- `GPT_URL_TIMEOUT_MS` (default: `20000`)
- `GPT_URL_RETRIES` (default: `1`)

## Controlled Test
- Controlled test run: `AUTOGEN_LIMIT=20 USE_GPT_URL=1`.
- Use only for targeted validation of URL chooser behavior; do not enable as-is in production cron.

---

## Backup And Memory

### Backup
- Full backup: `bash scripts/backup_project_full.sh`
- Sheet snapshot only: `node scripts/backup_sheet_snapshot.mjs`
- Sheet snapshot diagnostics: `node scripts/backup_sheet_snapshot.mjs --diag`
- Sheet snapshot custom output: `node scripts/backup_sheet_snapshot.mjs --out backups/snapshots/custom_snapshot.json`

### Memory
- Generate project memory: `node scripts/generate_project_memory.mjs`
- Update project memory after diffs: `node scripts/update_project_memory.mjs`
- Review/compress memory: `node scripts/review_project_memory.mjs`

### Sheet QC Pipeline
- Audit latest snapshot: `node scripts/audit_sheet_snapshot.mjs`
- Propose safe patch from audit: `node scripts/propose_sheet_patch_from_audit.mjs`
- Propose deterministic category-only patch from domain mapper: `node scripts/propose_taxonomy_patch.mjs`
- Propose deterministic official_url patch for URL errors: `node scripts/propose_url_errors_patch.mjs`
- Propose deterministic tags-only patch for taxonomy mismatch warnings: `node scripts/propose_taxonomy_mismatch_patch.mjs --category AI --limit 25`
- Propose patch via Codex CLI: `bash scripts/propose_sheet_patch_codex.sh`
- Validate patch JSON: `node scripts/validate_sheet_patch.mjs --patch backups/snapshots/sheet_patch.proposed.json`
- Review patch without writing: `node scripts/apply_sheet_patch.mjs --patch backups/snapshots/sheet_patch.proposed.json --dry-run`
- Apply patch to Sheet: `node scripts/apply_sheet_patch.mjs --patch backups/snapshots/sheet_patch.proposed.json`
- End-to-end pipeline dry-run: `bash scripts/run_sheet_qc_pipeline.sh`
- End-to-end pipeline with Codex proposer: `bash scripts/run_sheet_qc_pipeline.sh --proposer=codex`
- End-to-end pipeline for URL errors: `bash scripts/run_sheet_qc_pipeline.sh --focus=url_errors`
- End-to-end pipeline apply: `bash scripts/run_sheet_qc_pipeline.sh --proposer=stub --apply`

### Feature Flags
- `SHEET_PROPOSER=stub|codex` selects the proposer backend for the QC pipeline and the safe autogen orchestrator.
- `LEGACY_OPENAI_AUTOGEN=1` re-enables the old direct-OpenAI autogen path in `sheet_ai_autogen_9_strict_v2.mjs`.

### Notes
- Memory summaries are stored under `memory/`.
- Agent operating rules are stored under `ai-os/`.
- Backup artifacts are stored under `backups/`.
- `backup_sheet_snapshot.mjs` reuses the project's existing Google Sheets auth sources and `--diag` prints only presence/missing state, never secrets.
- Latest pipeline files live in `backups/snapshots/`: snapshot, audit, proposed patch, and apply log.
- Direct Sheet writes should be funneled through `apply_sheet_patch.mjs` with `--strict` and `--max-changes 50`.
- `scripts/taxonomy_domain_map.json` is a deterministic domain-to-category allowlist for fixing category taxonomy errors; extend it by adding normalized domains without `www`.
- `scripts/propose_url_errors_patch.mjs` fixes only deterministic `official_url` errors: `http -> https`, and recovery from explicit URL fields already present in the snapshot.
- QC eligibility: rows with status `blacklist`/`disabled` and duplicate-or-alias style statuses are skipped by `audit_sheet_snapshot.mjs`, counted in `skipped_*`, and do not block `AUDIT_PASS`.
- URL policy exception: `https://huggingface.co/` is allowed as a valid platform root for the `hugging-face` row; generic-root blocking remains in place for hosts like `github.com`.

---

## Bing Webmaster Operations

### Purpose
Safe local operational access to Bing Webmaster Tools for `tools.utildesk.de`, without storing the real API key in git.

### Secret File
- Local only: `secrets/bing-webmaster.env`

### Helper
- `python scripts/bing_webmaster_api.py smoke`
- `python scripts/bing_webmaster_api.py sites`
- `python scripts/bing_webmaster_api.py quota`
- `python scripts/bing_webmaster_api.py feeds`
- `python scripts/bing_webmaster_api.py crawl-summary --days 30`
- `python scripts/bing_webmaster_api.py submit-feed`
- `python scripts/bing_webmaster_api.py submit-batch --url https://tools.utildesk.de/ --url https://tools.utildesk.de/ratgeber/`
- `python scripts/bing_webmaster_api.py submit-url --url https://tools.utildesk.de/ratgeber/`

### Notes
- The helper uses the Bing Webmaster API-key flow.
- The secret file is git-ignored.
- Use `sites` or `call --method GetUserSites` for verified-site listing; `GetSiteList` is not a working public JSON method.
- Prefer submitting canonical HTML pages, not JSON/Markdown/feed/LLMS helper endpoints.
- For live noindex control of machine endpoints on Cloudflare Pages, update `site/functions/` alongside any `_headers` declarations.
- Bing currently does not expose a public URL Inspection API equivalent to GSC URL Inspection API.

---

## IndexNow Operations

### Purpose
Fast URL-change notifications for canonical HTML pages on `tools.utildesk.de`.

### Public Key File
- `site/public/c8e698e7-44e8-41e1-86d5-594ba2697475.txt`

### Helper
- `python scripts/indexnow_submit.py smoke`
- `python scripts/indexnow_submit.py submit-batch --url https://tools.utildesk.de/ --url https://tools.utildesk.de/ratgeber/ --wait-live`
- `python scripts/indexnow_submit.py submit-git-range --rev-range HEAD~1..HEAD --wait-live`

### Notes
- IndexNow key is public by design and is not treated as a secret.
- By default the helper submits to both the global IndexNow endpoint and the direct Bing endpoint.
- Submit canonical HTML pages only.
- `scripts/cron_publish_push.sh` now includes a non-blocking post-deploy IndexNow step for tools releases, and the hook is called from the real synced-publish path.
