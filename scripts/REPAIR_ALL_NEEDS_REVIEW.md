# repair_all_needs_review.mjs

Batch-repair script for rows in Google Sheet (`Tabellenblatt1`) with `status=NEEDS_REVIEW`.

## Usage

Dry-run (default):

```bash
node scripts/repair_all_needs_review.mjs --json
```

Apply changes:

```bash
node scripts/repair_all_needs_review.mjs --apply --json
```

Optional filters:

- `--limit N` or `--limit=N`
- `--offset N` or `--offset=N`
- `--only slug1,slug2` or `--only=slug1,slug2`

Batch examples:

```bash
# First batch (40 rows)
node scripts/repair_all_needs_review.mjs --limit 100 --offset 0

# Apply a later batch with stricter runtime controls
REQUEST_TIMEOUT_MS=12000 VALIDATION_CONCURRENCY=4 \
  node scripts/repair_all_needs_review.mjs --limit 100 --offset 100 --apply

# First apply batch (40 rows)
node scripts/repair_all_needs_review.mjs --apply --limit=40

# Second apply batch (next 40 rows in row_index order)
node scripts/repair_all_needs_review.mjs --apply --offset=40 --limit=40
```

## Runtime controls

Safe defaults for local and cron runs:

- `VALIDATION_CONCURRENCY=6`
- `CONNECT_TIMEOUT_MS=8000`
- `REQUEST_TIMEOUT_MS=15000`
- `MAX_REDIRECTS=6`

These values affect only external URL validation and redirect resolution. They do not
change how the script chooses candidate URLs or tags.

- `CONNECT_TIMEOUT_MS`
  - caps time-to-first-response for each HEAD/GET verification attempt
- `REQUEST_TIMEOUT_MS`
  - caps total time spent resolving one URL across redirects and fallback GET
- `MAX_REDIRECTS`
  - caps manual redirect hops per URL
- `VALIDATION_CONCURRENCY`
  - caps concurrent fallback-domain verification tasks to avoid TLS storms

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

- connect timeout: default 8s
- overall request timeout: default 15s
- redirects: max 6
- HEAD first, GET-range fallback
- no large body download
- global watchdog per URL to force abort on slow/broken endpoints

Then final URL is validated by `validateOfficialUrl()`.

## library_or_model fallback

If `classifyEntity(slug,title) === library_or_model` and DDG has no candidates,
script also tries GitHub/Hugging Face candidates.

Acceptance rules:

- URL must pass `resolveFinalUrl()`
- GitHub/Hugging Face path must look slug-related (owner/repo or path similar to slug)
- URL must pass `validateOfficialUrl()`

## Output

Run summary includes:

- `processed_count`
- `skipped_timeouts_count`
- `offset`
- `limit`
