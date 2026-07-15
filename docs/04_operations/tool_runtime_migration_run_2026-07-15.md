# Tool runtime migration run — 2026-07-15

## Live-request ledger

Machine-enforced ledger: `docs/04_operations/tool_runtime_live_request_ledger_2026-07.json`.

- Hard remaining-release limit after the quota reset: 500 synthetic Cloudflare-facing requests.
- Absolute network hold: no intentional request to the production Pages/Worker/API/D1/KV/R2 surfaces before `2026-07-16T00:05:00Z`.
- Current post-reset reservations: 0.
- Remaining post-reset budget: 500.
- Every live command must reserve its deterministic worst-case count in the JSON ledger before its first request. Reservations are not automatically reclaimed.
- Automatic retries and concurrent canary loops are forbidden. One retry may be separately reserved only after a genuine transient transport failure.

The old pattern of a 2,456-route live capture followed by a 10,754-resource production audit is forbidden. It provided useful migration evidence once, but repeated synthetic crawling consumed tens of thousands of free-tier Worker and Pages Function invocations. All-route confidence now comes from exhaustive localhost D1/Worker parity, local resource/hash audits and one bounded 24-slug production canary.

## Saved evidence carried forward

- Clean release baseline: `bc2108b8` on `codex/tool-runtime-migration-20260714`, aligned with `origin/master` at resume time.
- Production D1 backup: `site/.runtime/backups/20260715T140213Z/utildesk-content-runtime-production.sql`, SHA-256 `e484e7e7bd6254e0d862bb25f5648c89cc9df8311aa6a25eda1b9630eb797e51`.
- Frozen fallback archive: `site/.runtime/backups/20260715T140213Z/pages-frozen-7a4190c4.tar.zst`, SHA-256 `8b292e374ef8b7af740ed72f7b2569ee86b7b3e748436a5aac75ec104b1ac511`.
- Frozen fallback tag: `tool-runtime-fallback-20260714` at `f0f280e7`.
- Independent fallback Pages deployment: `44f4f878` in project `utildesk-tool-fallback`.
- Last recorded runtime Worker version: `80f70efe-25ed-4067-a4f7-f2e1cb5607b7`.
- Last verified Pages deployment before this run: `3953ef98-b27e-4f68-acc6-b2950eaff99a` for `bc2108b8`.
- Saved exhaustive post-static-cutoff evidence: 2,456/2,456 status 200, 2,456 `tools-v1` headers, zero empty bodies and exact HTML/SEO parity.
- Saved recovery drill: 48/48 frozen DE/EN pages exact, all with `frozen-7a4190c4`; Ratgeber remained `ratgeber-v1`; tool mode was restored to `on` at that checkpoint.

No saved exhaustive live evidence will be regenerated during this release.
