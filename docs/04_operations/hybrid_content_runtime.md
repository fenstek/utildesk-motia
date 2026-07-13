# Hybrid Content Runtime

## Purpose

Utildesk currently keeps the public `tools.utildesk.de` deployment on Cloudflare Pages and Astro static output. That remains the production source until each route cluster has passed a dedicated migration and SEO acceptance check.

The runtime pilot separates content publication from the site build:

1. Markdown remains the editorial source of truth in `content/`.
2. A publisher serializes selected entries into Cloudflare D1.
3. A small Worker renders only runtime routes from D1.
4. Cloudflare Cache API stores rendered public HTML for five minutes, with stale-while-revalidate for one day.

The first Worker is intentionally an isolated, `noindex` preview. It has no production route or custom domain.

## Commands

Build the isolated Worker app:

```powershell
npm --prefix site run build:hybrid
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

Deploy only the isolated preview Worker:

```powershell
Set-Location site
node_modules/.bin/wrangler.cmd deploy --config dist/server/wrangler.json
```

## Cache Contract

The generated cache-version module hashes the runtime renderer sources at build time. A renderer change therefore receives a new cache key automatically; an editorial D1 publication does not require a Worker rebuild and appears within five minutes.

The generated file lives in `site/runtime-src/generated/` and must remain untracked.

## Rollout Order

1. Keep the Worker route under `/runtime-preview/` and verify rendering, D1 reads, edge cache, mobile layout and noindex headers.
2. Add canonical Ratgeber runtime routes behind a reversible traffic split. Preserve current canonical, hreflang, structured data, search policy and sitemap behavior.
3. Migrate Ratgeber listings and feeds to D1-backed indexes.
4. Move tool detail pages in small search tiers, then tool listings and category pages.
5. Remove static data paths only after equivalent runtime monitoring, cache invalidation and rollback commands exist.

Do not use the preview Worker for broad tool publishing, Google sitemap changes or production route takeover without a separate rollout decision.
