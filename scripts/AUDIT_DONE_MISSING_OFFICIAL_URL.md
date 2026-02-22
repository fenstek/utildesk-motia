# audit_done_missing_official_url.mjs — Documentation

Finds DONE rows in the Google Sheet that are missing `official_url`,
then repairs them via a multi-step resolution pipeline.

## Purpose

Published tool pages (status=DONE) that lack an `official_url` are incomplete.
This script discovers and repairs them without manual intervention.

## Repair Pipeline

For each DONE row with empty `official_url`:

1. **Wikidata P856** — fetches the official website claim from Wikidata (if `wikidata_id` present).
2. **DDG** — queries DuckDuckGo HTML search via `resolveOfficialUrlByDDG()`.
3. **GPT** — asks GPT to choose among DDG candidates (requires `USE_GPT_URL=1`).

Each candidate URL is validated via `validateOfficialUrl()` from `scripts/lib/url_policy.mjs`.

### On success
- Sheet column K (`official_url`) updated with the resolved URL.
- Notes column updated with `audit:fixed:<source>:<url>`.
- MD frontmatter `official_url` field patched in `content/tools/<slug>.md`.
- Status remains `DONE`.

### On failure (URL not found)
- Status set to `NEEDS_REVIEW`.
- Notes column updated with `audit:done_missing_url:no_url_found`.
- MD file is NOT touched.

## Usage

```bash
# Dry-run (default) — shows what would change, no writes
node scripts/audit_done_missing_official_url.mjs

# Apply: write to Sheet + patch MD files
node scripts/audit_done_missing_official_url.mjs --apply=1

# Limit to specific slugs
node scripts/audit_done_missing_official_url.mjs --apply=1 --only=uipath,claude

# Limit to first N rows
node scripts/audit_done_missing_official_url.mjs --apply=1 --limit=20

# With GPT URL chooser enabled
USE_GPT_URL=1 node scripts/audit_done_missing_official_url.mjs --apply=1
```

## Output (dry-run example)

```
────────────────────────────────────────────────────────────────────────
audit_done_missing_official_url: 6 DONE rows scanned
  REPAIRED: 2  |  NEEDS_REVIEW: 4
────────────────────────────────────────────────────────────────────────

#    row   slug                           outcome        detail
────────────────────────────────────────────────────────────────────────
1    42    uipath                         repaired       wikidata_p856 → https://www.uipath.com/
2    91    openai-gpt-modelle             repaired       ddg → https://openai.com/
3    55    automation-anywhere            needs_review   no_valid_url_found
4    78    adobe-illustrator              needs_review   no_valid_url_found
5    83    coreldraw                      needs_review   no_valid_url_found
6    99    inkscape                       needs_review   no_valid_url_found
```

## JSON Summary

```json
{
  "ok": true,
  "mode": "apply",
  "ts": "2026-02-22T10:00:00Z",
  "done_missing_url": 6,
  "repaired": 2,
  "needs_review": 4,
  "applied_updates": 14,
  "results": [...]
}
```

## When to Run

- After initial deployment to repair legacy DONE rows.
- After bulk imports that may lack official_url.
- As part of periodic health checks.
- **Not part of the regular cron** — run manually.

## Safety

- Dry-run by default — no writes unless `--apply=1` is passed.
- Validated via `validateOfficialUrl()` — DENY_HOSTS, DENY_SUBSTR, wrong-entity detection.
- MD patches use YAML frontmatter upsert — never touch the body.
- Status only changes DONE → NEEDS_REVIEW (never DONE → NEW or DONE → ERROR).
