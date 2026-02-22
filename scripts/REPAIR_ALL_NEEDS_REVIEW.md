# repair_all_needs_review.mjs

Batch-repair script for rows in Google Sheet (`Tabellenblatt1`) with `status=NEEDS_REVIEW`.

## Usage

Dry-run (default):

```bash
node scripts/repair_all_needs_review.mjs --json
```

Apply changes:

```bash
node scripts/repair_all_needs_review.mjs --apply=1 --json
```

Optional filters:

- `--limit=N`
- `--offset=N`
- `--only=slug1,slug2`

Batch examples:

```bash
# First batch (40 rows)
node scripts/repair_all_needs_review.mjs --apply=1 --limit=40

# Second batch (next 40 rows in row_index order)
node scripts/repair_all_needs_review.mjs --apply=1 --offset=40 --limit=40
```

## Pipeline

For each `NEEDS_REVIEW` row:

1. URL repair
- Validate existing `official_url` via `validateOfficialUrl()`.
- If invalid/missing:
  - Wikidata P856 (`wikidata_id`) -> validate
  - DDG resolver -> validate
  - DDG candidates list -> validate each
  - GPT chooser (only among DDG candidates) -> validate
  - Fallback candidates (when DDG has no candidates):
    - domain guess for brand-like slug
    - extra GitHub/Hugging Face candidates for `library_or_model`

2. Tag repair
- If tags are missing/generic:
  - GPT tag enrichment
  - heuristic tag enrichment
  - normalize (`lowercase`, `trim`, `dedupe`)

3. Final gate
- Move to `NEW` only if:
  - `validateOfficialUrl(...).ok === true`
  - tags contain at least 1 specific tag

Otherwise row remains `NEEDS_REVIEW`.

## URL unresolved diagnostics

Script emits:

- `url_unresolved_reasons` (counters)
- `samples_by_reason` (up to 5 slugs per reason)

Tracked reasons:

- `missing_title`
- `wikidata_no_p856`
- `ddg_no_candidates`
- `ddg_error`
- `gpt_skipped_no_candidates`
- `all_candidates_rejected_by_policy`
- `head_check_failed`

## Fallback domain guess (safe mode)

Triggered only when DDG has no candidates.

Brand-like slug rules:

- length: 3..30
- charset: `[a-z0-9-]`
- rejects noisy tokens such as `tool`, `app`, `free`, `download`, etc.

Candidate domains (max 6):

- `.com`, `.ai`, `.io`, `.app`, `.net`, `.org`

Each candidate is verified by `resolveFinalUrl()` with limits:

- timeout: ~3.5s
- redirects: max 5
- HEAD first, GET-range fallback
- no large body download

Then final URL is validated by `validateOfficialUrl()`.

## library_or_model fallback

If `classifyEntity(slug,title) === library_or_model` and DDG has no candidates,
script also tries GitHub/Hugging Face candidates.

Acceptance rules:

- URL must pass `resolveFinalUrl()`
- GitHub/Hugging Face path must look slug-related (owner/repo or path similar to slug)
- URL must pass `validateOfficialUrl()`
