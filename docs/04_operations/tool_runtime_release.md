# Tool runtime release and rollback

Status: implementation runbook; production remains gated until preview parity passes.

## Invariants

- `content/tools` and `content/en/tools` are the editorial source. D1 is a derived read model.
- A tool upsert is one DE/EN release unit. Missing or non-public siblings stop the release.
- Upsert, deactivate, redirect and tombstone use a single D1 REST `batch` request. D1 batches are transactional: one failed statement rolls back the sequence.
- Two tool pairs share one statement (at most 100 bound parameters including the immutable asset key/hash). A 100-tool release is 50 statements; the current full 1,228-tool projection is 614 statements.
- There is no physical delete path. A removed route is `disabled`, `redirect` or `tombstone` first.
- Production requires a clean commit, an explicit confirmation string, a fresh non-empty D1 SQL export and an API lookup that matches the configured database name and UUID.
- Ratgeber continues to use its independent runtime, route proxy and kill switch.

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

Read-only remote reconcile:

```bash
source /path/to/existing/utildesk-env.sh
npm --prefix site run publish:runtime -- \
  --kind tool --operation reconcile --all --remote --dry-run \
  --config wrangler.hybrid.jsonc \
  --database utildesk-content-runtime-preview
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

The tool cache key is `renderer version + D1 revision + source_hash`. Verify a first `MISS`, a second `HIT`, then change only a local/preview revision and verify another `MISS` followed by `HIT`. Required evidence headers are `X-Utildesk-Content-Runtime: tool-v2`, `X-Utildesk-Content-Version`, `X-Utildesk-Source-Revision` and `X-Utildesk-Source-Hash`. This cache identity is independent from the Ratgeber cluster.

## Content-addressed illustrations

The exporter hashes each referenced `/images/tools/*.webp` and projects `asset_key` plus `asset_hash` through migration `0003_tool_asset_projection.sql`. A rendered illustration uses `/tool-assets/<sha256>/<original-name>.webp`; this URL is immutable and the Worker verifies the bytes before returning them.

For routine remote production upserts containing new or replaced illustrations, configure the verified production R2 bucket as the Worker's `TOOL_ASSETS` binding and pass the same bucket to the publisher:

```bash
npm --prefix site run publish:runtime -- \
  --kind tool --slugs-file /path/to/slugs.txt --remote --production \
  --confirm TOOL_RUNTIME_PRODUCTION --backup /private/backup/before.sql \
  --asset-bucket <verified-tool-assets-bucket> \
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

Do not run this section until preview parity, allowlist selection and account ownership are all confirmed.

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
