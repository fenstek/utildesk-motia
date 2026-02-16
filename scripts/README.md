# Scripts Overview

## Core Automation Scripts

### sheet_seed_from_alternatives.mjs
Seeds Google Sheet with NEW rows from alternatives audit missing matches. See [sheet_seed_from_alternatives.md](./sheet_seed_from_alternatives.md) for details.

### sheet_rebuild_official_url.mjs
Rebuilds official_url for rows with specified status (typically NEEDS_REVIEW). Uses DDG + GPT validation.

### sheet_ai_autogen_9_strict_v2.mjs
Main autopilot: processes NEW rows, generates content, creates markdown files.

### audit_alternatives_render.mjs
Audits alternatives sections in existing tools, generates JSON report of missing tools.

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
- Hard aliases: `mitsuku->kuki`, `pytorch-lightning->pytorch`, `google-bard->gemini`, `openai-whisper->whisper`, `runway-ml->runway`, `runwayml->runway`, `runway-ai->runway` (skipped if canonical exists).
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
