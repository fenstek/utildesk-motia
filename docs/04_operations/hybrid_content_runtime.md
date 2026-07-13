# Hybrid Content Runtime

## Purpose

Utildesk currently keeps the public `tools.utildesk.de` deployment on Cloudflare Pages and Astro static output. That remains the production source until each route cluster has passed a dedicated migration and SEO acceptance check.

The runtime pilot separates content publication from the site build:

1. Markdown remains the editorial source of truth in `content/`.
2. A publisher serializes selected entries into Cloudflare D1.
3. A small Worker renders only runtime routes from D1.
4. Cloudflare Cache API stores rendered public HTML for five minutes, with stale-while-revalidate for one day.

The first Worker is intentionally an isolated, `noindex` preview. It has no production route or custom domain.

## Production Ratgeber Runtime

The completed first production slice is Ratgeber in both locales plus the three compact sitemaps. It is deliberately not a Worker Route: `tools.utildesk.de` is a Cloudflare Pages custom domain behind external INWX DNS, so Pages `functions/_middleware.js` proxies only these paths to the D1 Worker:

- `/ratgeber` and `/ratgeber/*`
- `/en/ratgeber` and `/en/ratgeber/*`
- `/sitemap.xml`, `/sitemap-focus.xml`, `/sitemap-bing.xml`
- `/runtime-assets/*`

All tool pages, the home page, APIs, feeds, robots.txt, Markdown endpoints and the normal Pages assets remain on the static deployment. The worker reads from `utildesk-content-runtime-production` and merges its Ratgeber entries with a generated snapshot of the compact static sitemap. The snapshot is created from `site/dist/sitemap.xml` whenever the static site changes, so it retains the staged tool URLs without relying on the separate `pages.dev` deployment source. This preserves the search contract: robots.txt still advertises only `sitemap.xml`; sitemap-focus stays the explicit Bing/GSC freshness surface.

The Pages proxy is fail-open. A Worker/D1 upstream error or an imported-content 404 falls back to the existing static route. For an immediate manual rollback without a rebuild, write `off` to the existing Pages KV binding `RATGEBER_REVIEW` under `content-runtime:ratgeber`; delete the key or set any other value to re-enable the runtime.

## Commands

Build the isolated Worker app:

```powershell
npm --prefix site run build:hybrid
```

Build the production runtime (writes only `site/dist-runtime/`, never the Pages `site/dist/` artifact):

```powershell
npm --prefix site run build:runtime
```

Inspect a prepared single-entry D1 upsert without changing D1:

```powershell
npm --prefix site run publish:runtime -- --kind ratgeber --locale de --slug shared-ai-workspaces-team-kontext-memory-agenten
```

Publish one entry, or a complete locale cluster, to the preview D1 database:

```powershell
npm --prefix site run publish:runtime -- --kind ratgeber --locale de --slug shared-ai-workspaces-team-kontext-memory-agenten --remote
npm --prefix site run publish:runtime -- --kind ratgeber --locale en --all --remote
```

Publish a production Ratgeber change without a static build or a Worker deploy:

```powershell
npm --prefix site run publish:runtime -- --kind ratgeber --locale de --slug <slug> --remote --database utildesk-content-runtime-production --config wrangler.runtime.production.jsonc
npm --prefix site run publish:runtime -- --kind ratgeber --locale en --slug <slug> --remote --database utildesk-content-runtime-production --config wrangler.runtime.production.jsonc
```

The D1 source hash/revision changes the edge cache key, so the updated article and archive are visible on the next request. The sitemap responses have a five-minute edge TTL and include the same D1 Ratgeber set.

Deploy only the isolated preview Worker:

```powershell
Set-Location site
node_modules/.bin/wrangler.cmd deploy --config dist/server/wrangler.json
```

## Cache Contract

The generated cache-version module hashes the runtime renderer sources at build time. A renderer change therefore receives a new cache key automatically; an editorial D1 publication does not require a Worker rebuild and appears on the next request under its new content-revision cache key.

The generated file lives in `site/runtime-src/generated/` and must remain untracked.

## Rollout Order

1. Keep the Worker route under `/runtime-preview/` and verify rendering, D1 reads, edge cache, mobile layout and noindex headers.
2. Completed: add canonical Ratgeber runtime routes behind a reversible Pages proxy; preserve canonical, hreflang, structured data, search policy and sitemap behavior.
3. Completed for Ratgeber archive and compact sitemaps. Feeds remain static until they receive their own SEO acceptance check.
4. Next: move tool detail pages in small search tiers, then tool listings and category pages.
5. Remove static data paths only after equivalent runtime monitoring, cache invalidation and rollback commands exist.

Do not use the preview Worker for broad tool publishing, Google sitemap changes or production route takeover without a separate rollout decision.
