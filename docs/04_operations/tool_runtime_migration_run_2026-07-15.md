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

## Local implementation and gates after quota hold

No Cloudflare-facing request was issued while implementing these stages. The machine ledger remained at `0/500`.

- Added hard local/full, production/canary and production/delta contracts. Production commands reject `--all`, canaries above 24 slugs, performance sets above 10 routes, budgets above 500, execution before the reset, and cumulative reservations above the ledger limit.
- Added runtime DE/EN tool catalog JSON, detail JSON and Markdown endpoints. Machine endpoints remain fetchable with `X-Robots-Tag: noindex`, source revision/hash headers and conditional ETags.
- Added monotonic aggregate cache identities through migration `0006_runtime_collection_revisions.sql`; tool, homepage, Tool Index, category and tag cache versions no longer depend on a collision-prone `MAX(updated_at)` aggregate.
- Added D1-backed homepage, Tool Index, category and tag shells. Pages activation uses the independent opt-in key `content-runtime:tool-shell`; Ratgeber remains independent.
- Added `TOOL_ASSETS`/`utildesk-tool-assets` R2 support. Local R2 proof for ChatGPT returned exact SHA-256 `7137d1d1776dfb0df9bae5fde01ad1b4b85ea711ed102d25c1356efa69d8ce3f`, `image/webp`, immutable caching and `X-Utildesk-Asset-Source: r2`. The historical 1,146 objects remain on hash-verified Pages/frozen fallback; only changed/new assets are copied to R2.
- Removed the unused `@astrojs/mdx` integration and dependency.
- Normal static builds now emit zero tool detail HTML and zero per-tool JSON/Markdown mirrors. `UTILDESK_BUILD_FROZEN_TOOL_DETAILS=1` still reproduces all frozen HTML/JSON/Markdown fallback artifacts.
- Added `release:tool-runtime`, which discovers bounded changed slugs, validates paired public state, publishes content-addressed assets, performs paired atomic D1 state changes, verifies stored source/asset hashes, runs bounded delta validation, submits only changed canonical HTML to both IndexNow endpoints, writes a compact report, and proves `site/dist` is unchanged.

Local evidence:

- Fresh local migrations `0001` through `0006`: applied successfully to an isolated local D1 state.
- Local D1 projection: 1,228 active DE plus 1,228 active EN tools and 38 plus 38 Ratgeber entries.
- Exhaustive tool HTML capture: `2,456/2,456` status 200, zero invalid records, exact saved static HTML/SEO parity, zero errors.
- Local internal resource audit: 9,526 unique internal targets checked. The two Worker-only 404s are `/api/ratgeber.json` and `/en/api/ratgeber.json`; both remain static Pages-owned files and are outside the tool-machine migration.
- External Google favicon candidates: 1,228 unique URLs were structurally recorded but intentionally not fetched. No third-party or production resource crawl was performed.
- Runtime unit/integration suite after shell, publisher and quota enforcement: 68/68 passed (`node --test site/scripts/tests/*.test.mjs`).
- Tool machine endpoints: saved final exhaustive local comparison checked 4,912 DE/EN JSON/Markdown responses with zero semantic or header failures. Two DE JSON files (`axure-rp`, `binder`) differ only by source-leading whitespace removed by D1 normalization.
- Runtime shell parity: 968/968 homepage, Tool Index, category and locale-specific tag routes matched current static HTML SEO, internal-link and image structures exactly. The gate also caught and fixed EN taxonomy fallback and non-ISO guide-date ordering before release.
- One-time normal build proof: 1,053 total static pages in 9.80 seconds, peak RSS 582,924 KiB, and zero tool detail HTML or per-tool JSON/Markdown mirrors. The postbuild guard reports all 7,368 localized detail artifacts as D1-owned.
- Content-only release proof: a two-card/two-asset dry-run reserves 25 worst-case requests, leaves 475/500, sets `astroBuild=false`, and does not create or modify `site/dist`.
- Local browser proof: Chrome rendered representative homepage, Tool Index, detail, category and tag layouts at 390x844 and 1440x1000 from localhost HTML and the exact runtime stylesheet. External font/image requests were removed from the self-contained fixtures; no production or third-party URL was fetched. The inspected frames had coherent desktop/mobile geometry and no visible horizontal overflow.
