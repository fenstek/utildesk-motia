# GPT Official URL Fallback

## Purpose
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
- Known hard alias examples: `mitsuku->kuki`, `pytorch-lightning->pytorch` (skipped).

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
