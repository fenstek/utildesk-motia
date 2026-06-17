# repair_all_needs_review smoke

- ts_utc: 2026-02-28T12:29:03Z
- scope: `node scripts/repair_all_needs_review.mjs --limit 20`
- defaults:
  - `VALIDATION_CONCURRENCY=6`
  - `CONNECT_TIMEOUT_MS=8000`
  - `REQUEST_TIMEOUT_MS=15000`
  - `MAX_REDIRECTS=6`

## Dry-run

- duration_s: 19.56
- mode: `dry-run`
- processed_count: 20
- needs_review_pool_size: 160
- moved_to_new: 17
- still_needs_review: 3
- url_fixed: 3
- url_unresolved: 3
- tags_fixed: 14
- tags_unresolved: 0
- skipped_timeouts_count: 0

## Apply

- duration_s: 22.28
- mode: `apply`
- processed_count: 20
- needs_review_pool_size: 160
- moved_to_new: 16
- still_needs_review: 4
- url_fixed: 2
- url_unresolved: 4
- tags_fixed: 13
- tags_unresolved: 0
- skipped_timeouts_count: 0
- applied_updates: 50

## Notes

- Dry-run and apply both completed under 60 seconds.
- The remaining unresolved rows during smoke were limited to policy/head-check failures, not hanging network validation.
