# Tool runtime release and rollback

Status: quota-safe runtime release runbook.

## Quota-safe validation contract

Live exhaustive validation is permanently disabled. The former pattern of a
2,456-route production capture followed by a 10,754-resource audit is forbidden:
cache hits still consume Worker/Pages Functions requests, and repeating that
pattern exhausted most of the free daily quota without adding proportional
release confidence.

Use only these three contracts:

```bash
# Exhaustive 2,456-route parity against localhost Miniflare/local D1.
npm --prefix site run gate:tool-runtime-local-full -- \
  --base-url http://127.0.0.1:8791 \
  --canonical-origin https://tools.utildesk.de \
  --baseline site/.runtime/audits/<run>/fresh-static/manifest.json \
  --out site/.runtime/audits/<run>/local-full

# Exactly one deterministic production canary, at most 24 slugs / 48 HTML GETs.
npm --prefix site run gate:tool-runtime-production-canary -- \
  --execute --max-live-requests 500 \
  --ledger docs/04_operations/tool_runtime_live_request_ledger_2026-07.json \
  --baseline site/.runtime/audits/<run>/fresh-static/manifest.json \
  --out site/.runtime/audits/<run>/production-canary

# Changed HTML/JSON/Markdown plus changed content-addressed assets only.
npm --prefix site run gate:tool-runtime-production-delta -- \
  --git-range <base>..<head> --execute --max-live-requests 500 \
  --ledger docs/04_operations/tool_runtime_live_request_ledger_2026-07.json \
  --out site/.runtime/audits/<run>/production-delta
```

Production commands refuse `--all`, more than 24 canary slugs, a budget above
500, a cumulative ledger over 500, and execution before the recorded reset
gate. The legacy capture and recursive resource-audit scripts refuse every
non-loopback origin. Reservations are written before the first request and are
never automatically reclaimed. There is no automatic retry; one retry may be
planned and ledgered only for a genuine transient transport failure.
The request ledger is the only tracked path allowed to change while the
publisher verifies the production release commit. Any content, runtime,
configuration or unrelated documentation change still blocks publication.

## Invariants

- `content/tools` and `content/en/tools` are the editorial source. D1 is a derived read model.
- A tool upsert is one DE/EN release unit. Missing or non-public siblings stop the release.
- Upsert, deactivate, redirect and tombstone use a single D1 REST `batch` request. D1 batches are transactional: one failed statement rolls back the sequence.
- Two tool pairs share one statement (at most 100 bound parameters including the immutable asset key/hash). A 100-tool release is 50 statements; the current full 1,228-tool projection is 614 statements.
- There is no physical delete path. A removed route is `disabled`, `redirect` or `tombstone` first.
- Production requires a clean commit, an explicit confirmation string, a fresh non-empty D1 SQL export and an API lookup that matches the configured database name and UUID.
- Ratgeber continues to use its independent runtime, route proxy and kill switch.
- `TOOL_ASSETS` is optional at runtime. If R2 is not enabled for the Worker/D1
  account, omit the production binding and use only `--allow-pages-fallback-assets`;
  changed asset bytes must fail closed instead of silently replacing a hash.
  Enabling R2 is an account-owner/billing action and is never inferred from a
  content release.

Cloudflare contracts used by the publisher:

- D1 batch transaction: <https://developers.cloudflare.com/d1/worker-api/d1-database/#batch>
- D1 REST batch body: <https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/>
- D1 limits: <https://developers.cloudflare.com/d1/platform/limits/>
- D1 export: <https://developers.cloudflare.com/d1/best-practices/import-export-data/#export-an-existing-d1-database>

## Local and dry-run gates

```bash
npm --prefix site run check:tool-public-state
npm --prefix site run test:tool-runtime

npm --prefix site run publish:runtime -- \
  --kind tool --slug chatgpt --dry-run

npm --prefix site run publish:runtime -- \
  --kind tool --slugs-file /path/to/slugs.txt --dry-run

npm --prefix site run publish:runtime -- \
  --kind tool --git-range <base>..<head> --dry-run
```

Dry-run output contains only keys, slugs, operation counts and validation results. It never includes Markdown bodies or credentials. A dirty source tree is reported and is a production blocker.

The full initial projection can be planned without changing D1:

```bash
npm --prefix site run publish:runtime -- \
  --kind tool --all --dry-run
```

Existing inactive alternative references are reported as migration-baseline warnings on `--all`; a targeted update to one of those cards is strict and must repair its inactive internal links before publication. Runtime rendering must still filter every alternative against the active D1 set, so warnings cannot become public 404 links.

## Reconcile

Offline against an exported query result:

```bash
npm --prefix site run publish:runtime -- \
  --kind tool --operation reconcile --all --dry-run \
  --d1-state /path/to/tool-state.json
```

Remote exhaustive reconcile is intentionally disabled under the permanent live-request budget. Export/query a bounded snapshot once, then reconcile locally:

```bash
source /path/to/existing/utildesk-env.sh
npm --prefix site run publish:runtime -- \
  --kind tool --operation reconcile --all --dry-run \
  --d1-state /private/snapshots/tool-state.json
```

Reconcile reports missing locale entries, extra active entries, expected routes in a non-active state, source-hash drift and asset-hash drift. It never mutates D1.

## Preview publication

Apply schema migrations before the first preview write, then take a preview backup if the database already contains data:

```bash
cd site
node_modules/.bin/wrangler d1 migrations apply utildesk-content-runtime-preview \
  --remote --config wrangler.hybrid.jsonc

node_modules/.bin/wrangler d1 export utildesk-content-runtime-preview \
  --remote --config wrangler.hybrid.jsonc \
  --output /private/backup/preview-before-tool-runtime.sql
```

Publish only after dry-run is green:

```bash
npm --prefix site run publish:runtime -- \
  --kind tool --slugs-file /path/to/slugs.txt --remote \
  --config wrangler.hybrid.jsonc \
  --database utildesk-content-runtime-preview
```

Build the isolated renderer and check the preview routes before any Pages proxy change:

```bash
npm --prefix site run build:runtime

curl -I https://<preview-worker>/runtime-preview/de/tools/chatgpt/
curl -I https://<preview-worker>/runtime-preview/en/tools/chatgpt/
```

Preview responses must be `noindex,nofollow,noarchive` while retaining the production self-canonical, DE/EN hreflang, JSON/Markdown alternates and JSON-LD. Canonical runtime routes are `/tools/<slug>/` and `/en/tools/<slug>/`. Active rows return `200`; `redirect` returns `301` to the stored `canonical_path`; `disabled` and unknown rows return `404`; `tombstone` returns `410`.

The tool cache key is `renderer version + D1 revision + source_hash`. Aggregate tool/shell routes use the monotonic `runtime_collection_revisions` identity from migration `0006`; it cannot collide when timestamps are equal. Required delivery evidence includes `X-Utildesk-Content-Runtime: tools-v1`, `X-Utildesk-Source-Revision` and `X-Utildesk-Source-Hash`. This cache identity is independent from the Ratgeber cluster.

## Content-addressed illustrations

The exporter hashes each referenced `/images/tools/*.webp` and projects `asset_key` plus `asset_hash` through migration `0003_tool_asset_projection.sql`. A rendered illustration uses `/tool-assets/<sha256>/<original-name>.webp`; this URL is immutable and the Worker verifies the bytes before returning them.

For routine remote production upserts containing new or replaced illustrations, the Worker's `TOOL_ASSETS` binding points to `utildesk-tool-assets`; pass the same bucket to the publisher:

```bash
npm --prefix site run publish:runtime -- \
  --kind tool --slugs-file /path/to/slugs.txt --remote --production \
  --confirm TOOL_RUNTIME_PRODUCTION --backup /private/backup/before.sql \
  --asset-bucket utildesk-tool-assets \
  --config wrangler.runtime.production.jsonc \
  --database utildesk-content-runtime-production
```

The publisher checks the local hash, uploads the content-addressed object first, downloads it to a private temporary directory, verifies the hash, and only then changes D1.

The initial pilot may use already-live static illustrations without enabling R2. This transitional mode is explicit:

```bash
npm --prefix site run publish:runtime -- \
  --kind tool --slugs-file /path/to/slugs.txt --remote --production \
  --confirm TOOL_RUNTIME_PRODUCTION --backup /private/backup/before.sql \
  --allow-pages-fallback-assets \
  --config wrangler.runtime.production.jsonc \
  --database utildesk-content-runtime-production
```

Before changing D1, `--allow-pages-fallback-assets` fetches every projected `/images/tools/*.webp` from the live Pages origin, requires `image/webp`, and verifies an exact SHA-256 match with the committed local file. It therefore cannot publish a new or replaced illustration that is not already live. R2 remains required for normal delta publishing of new image bytes.

Old Pages `/images/tools/*` files remain a read-only fallback: if the R2 binding or object is absent, the asset endpoint fetches the old Pages file and serves it only when its SHA-256 matches. Do not delete old Pages or R2 objects during this migration.

The bucket begins as a delta store. The 1,146 historical illustration objects remain safely available from the frozen/Pages fallback and are not bulk-copied during a content release. Every new or replaced image is uploaded content-addressed to R2 before its paired D1 update.

## Single content-only delta command

The normal 1-100 card flow is the wrapper below. It performs changed-slug discovery, strict DE/EN/public-state validation, content-addressed asset publication, one paired D1 transaction, post-write source-hash verification, bounded live HTML/JSON/Markdown/asset validation, and IndexNow for only the changed DE/EN canonical HTML URLs:

```bash
npm --prefix site run release:tool-runtime -- \
  --git-range <base>..<head> --operation upsert \
  --asset-bucket utildesk-tool-assets \
  --ledger docs/04_operations/tool_runtime_live_request_ledger_2026-07.json \
  --max-live-requests 500

# After inspecting the deterministic preflight and committing a clean release:
npm --prefix site run release:tool-runtime -- \
  --git-range <base>..<head> --operation upsert \
  --asset-bucket utildesk-tool-assets \
  --backup /private/backup/before.sql \
  --ledger docs/04_operations/tool_runtime_live_request_ledger_2026-07.json \
  --max-live-requests 500 --production --execute
```

The wrapper never invokes Astro and fingerprints `site/dist` before/after execution. It refuses `--all`, refuses a complete worst-case estimate beyond the remaining ledger, and reserves publisher, delta-validation and two IndexNow submissions before their respective live commands. An ordinary ten-card release with ten changed assets is budgeted at 97 requests.

## Runtime shell switch

Homepage, Tool Index, category and tag routes use a separate opt-in key:

- `content-runtime:tool-shell=off|on`
- delivery header `X-Utildesk-Content-Runtime: tool-shell-v1`

Missing/malformed KV state is `off`; a Worker 404/5xx/exception falls through to the Pages shell. This key does not alter `content-runtime:tools` or `content-runtime:ratgeber`. The admin endpoint is `/admin/ratgeber/api/tool-shell-runtime` and accepts only explicit `on`/`off` JSON.

Disabled/tombstoned rows carry `X-Utildesk-Route-State`, so Pages does not accidentally resurrect an intentionally retired tool from the frozen fallback. A genuinely missing D1 row still fails open to frozen static.

## Deactivate, redirect and tombstone

```bash
npm --prefix site run publish:runtime -- \
  --kind tool --operation deactivate --slug old-tool --dry-run

npm --prefix site run publish:runtime -- \
  --kind tool --operation redirect --slug old-tool --to-slug replacement --dry-run

npm --prefix site run publish:runtime -- \
  --kind tool --operation tombstone --slug removed-tool --dry-run
```

Multiple redirects use a JSON object such as `{ "old-a": "new-a", "old-b": "new-b" }` with `--redirects-file`, plus the corresponding `--slugs-file`.

## Production gate

Do not run this section until local-full HTML, machine, shell, resource, visual and build-graph gates are green.

1. Verify the configured account, production database UUID, Pages project and Worker.
2. Export production D1 to a private path outside Git.
3. Verify the export is non-empty and recent.
4. Verify the release commit is clean and contains the intended source hash.
5. Run dry-run, then the same command with `--remote --production`.

```bash
cd site
node_modules/.bin/wrangler d1 export utildesk-content-runtime-production \
  --remote --config wrangler.runtime.production.jsonc \
  --output /private/backup/tool-runtime-production-before-<release>.sql
cd ..

npm --prefix site run publish:runtime -- \
  --kind tool --slugs-file /path/to/allowlist.txt \
  --remote --production --confirm TOOL_RUNTIME_PRODUCTION \
  --backup /private/backup/tool-runtime-production-before-<release>.sql \
  --config wrangler.runtime.production.jsonc \
  --database utildesk-content-runtime-production
```

The publisher performs a live database lookup and schema-v2 check before its transactional batch. A wrong account, database name/UUID, missing column, old backup or dirty worktree is a hard stop.

## Rollback

One card: check out or otherwise prepare its previous committed DE/EN Markdown revision in a clean rollback worktree, then publish that pair. The previous `source_hash` creates a new D1 revision without rebuilding the site.

Route state: publish the previous active pair to reverse a deactivate, redirect or tombstone.

Database: do not improvise a bulk restore. First turn the tool runtime kill switch off, verify static/frozen fallback, preserve a second incident-time export, then use the Cloudflare D1 restore procedure or the verified SQL backup.

Renderer: roll the Worker back to its recorded deployment. This does not change Ratgeber's independent proxy setting.

Whole tool cluster: set only `content-runtime:tools=off` in the Pages runtime-control binding. The Ratgeber key remains unchanged. Verify canonical tool URLs against the frozen Pages origin before investigating D1/Worker.

Frozen static baseline for this migration is identified by Git tag `tool-runtime-fallback-20260714`; its private artifact path and checksum are recorded in the external migration report, not in Git.
