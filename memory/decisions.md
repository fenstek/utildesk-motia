# Decisions

## 2026-04-21

## 2026-04-22

- Treat `fa1c42d11a995127f3be253eb94477252e4c79ff` as the current good backup baseline for the repo and the live site state.
- Keep only one tracked markdown doc for the alternatives-render audit script: `scripts/audit_alternatives_render.md`.
- Do not keep case-only duplicate paths for the same document in git; Windows checkouts cannot represent them cleanly.
- Treat live sitemap hygiene as the first-line technical explanation for large GSC indexing error clusters on `tools.utildesk.de`.
- Keep alias redirects, but do not keep the same alias slugs as active published tool pages.
- Reserved route namespaces under `/tools/` (currently `tag`) must never be emitted as tool URLs in sitemap.
- Keep `origin/autobot` and `origin/master` aligned after manual releases; branch drift is an operational risk for tools publishing.
- `scripts/sync_autobot_to_master_ff.sh` must push from the remote-tracking ref, not assume a local `autobot` branch exists.

- `Ratgeber` publish закреплён как отдельный ручной flow поверх approved package с `opcl`, а не как часть `tools` cron.
- `scripts/cron_publish_push.sh` считать намеренно ограниченным `tools`-only publisher; его allowlist не ослаблять ради статей.
- Для import approved article package использовать `scripts/import_ratgeber_package.py`.
- Для manual article release использовать отдельный чистый checkout или worktree от свежего `origin/master`.
- `Ratgeber` hero covers must use the same lightbox contract as article inline images.
- `Ratgeber` cover rendering must respect the generated image's natural aspect ratio; do not force editorial SVG covers into a generic wide frame.
- Standalone inline article images in `ratgeber` should be rendered as dedicated figure blocks with explicit vertical spacing, not as naked markdown image paragraphs.
- If an article ships both `cover` and `workflow` editorial SVGs, the page renderer should avoid adding a second heavy frame around the artwork; the generated assets already carry their own composition.
- Hero cover SVGs should use a dense composition with minimal neutral border space, so the published page can render them large without creating a "small picture inside a big frame" effect.
- Treat AI retrieval as a first-class site contract, not as an afterthought:
  - keep `llms.txt`, `llms-full.txt`, feeds, catalogs, and page-level mirrors in the production codebase.
- Prefer the canonical trio for machine access to content:
  - human-facing HTML page
  - page-level JSON detail endpoint
  - page-level Markdown mirror
- Keep non-HTML agent endpoints crawlable but out of normal search result indexing via `X-Robots-Tag: noindex`.
- Do not rely on `process.cwd()/content` in the Astro app; use the shared content-root resolver so Windows pointer-file checkouts build the same as symlinked environments.
- Do not declare a fake `SearchAction` schema unless the public site exposes a stable query-parameter search contract that works server-side.
- Keep Bing Webmaster credentials local-only and git-ignored; never store the raw API key in repo-tracked files.
- Prefer a local env-file plus helper script for Bing operations instead of browser-only workflows.
- Treat Bing API coverage as partial compared to GSC: automate quota/submission/feed operations, but assume URL Inspection remains manual unless Microsoft exposes a public API later.
- For `tools.utildesk.de`, treat Bing crawl health as primarily a live-site contract check:
  - verify sitemap/feed state in Bing;
  - verify machine endpoints are fetchable but `noindex`;
  - verify canonical HTML pages stay indexable.
- Do not rely on Astro endpoint response headers alone for `X-Robots-Tag` on Cloudflare Pages machine endpoints.
- Enforce `X-Robots-Tag: noindex` for `/feed.*`, `/llms*.txt`, `/api/*`, and `/markdown/*` at the edge through `site/functions/`, with `_headers` kept only as a fallback/static declaration.
- After manual SEO or article releases, re-align `origin/autobot` to `origin/master` so the tools publishing branch does not drift behind production.
- Treat IndexNow as a first-class freshness signal alongside sitemap submission for `tools.utildesk.de`.
- Keep the IndexNow verification key public and repo-tracked at the site root; unlike Bing API credentials, it is not a secret.
- Automate IndexNow only for canonical HTML pages and only after they are live.
- Keep `ratgeber` IndexNow submission separate from the `tools` cron flow, just like the release process itself.
- Prefer dual IndexNow notification for this project:
  - submit to the global protocol endpoint for broad sharing;
  - also submit directly to Bing's own endpoint to improve Bing-side observability and reduce ambiguity in Webmaster tooling.
- Keep post-deploy freshness hooks reachable from the actual release path; do not leave IndexNow calls below early `exit 0` branches in cron automation.

## 2026-04-26

- Keep German as the default production language for `tools.utildesk.de`; publish English under `/en/`.
- English pages must use self-canonicals and reciprocal `hreflang` alternates, not canonicalize back to German.
- Treat multilingual Ratgeber publication as a package contract: autonomous publish requires both `content/ratgeber/<slug>.md` and `content/en/ratgeber/<slug>.md`.
- Keep English tool pages generated from the curated tool metadata until the sheet/backend has native English fields.
- Keep machine-readable discovery localized as well: `/en/api/*`, `/en/markdown/*`, `/en/feed.*`, `/en/llms.txt`, and `/en/llms-full.txt`.

## 2026-04-29

- Privacy rule: never submit, publish, or reuse the user's personal first name
  or surname in any project, account, outreach form, backlink submission, commit
  metadata, public profile, or third-party communication unless the user gives
  explicit permission for that exact use.
- For outreach/name fields, use only non-personal labels such as `Utildesk` or
  `Utildesk Team`. If a platform requires a real personal name, mark it blocked
  instead of guessing or copying names from legal/imprint pages.

## 2026-04-30

- For local Cloudflare diagnostics in `C:\projects\utildesk-motia`, use
  `CLOUDFLARE_API_TOKEN` from the git-ignored local `.env`.
- If the local `.env` must be restored, the approved source location is
  `C:\Users\sserg\OneDrive - JGDUS\projects\eventmanagement\.claude\worktrees\youthful-noether\.env.local`.
- Never commit or print the Cloudflare token value; store only variable names
  and source paths in tracked memory/docs.
