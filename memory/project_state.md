# Project State

## Summary

По состоянию на 2026-04-21 `utildesk-motia` — это production-репозиторий каталога AI-инструментов и связанных `ratgeber`-статей.

Основной live-flow проекта разделён на два независимых контура:

- `tools` publish: Google Sheet -> `content/tools/*.md` -> `autobot/master` -> Cloudflare Pages
- `ratgeber` publish: отдельный article pipeline на `opcl` -> `publish_ready/ratgeber/*` -> ручной import в чистый checkout от `origin/master`

## Important Operational Boundary

`tools` и `ratgeber` нельзя публиковать из одного и того же грязного checkout.

Причина:

- `scripts/cron_publish_push.sh` намеренно allowlist-ит только `content/tools/*.md`
- любые посторонние изменения в том же checkout должны ломать cron-run, а не коммититься вместе с инструментами

Это поведение считать правильным guardrail, а не багом.

## Ratgeber State

- На `opcl` article pipeline работает отдельно в `/opt/openclaw/workspace/agent-newsman`
- import в этот репозиторий разрешён только для package со статусом `approved_for_publish`
- для этого в репозитории есть `scripts/import_ratgeber_package.py`
- безопасный publish-flow описан в `docs/04_operations/ratgeber_publish.md`
- production rendering for `ratgeber` now treats the hero cover as a first-class article image:
  - the top cover uses the shared lightbox flow, not just inline prose images;
  - the cover is rendered in its natural aspect ratio instead of being forced into a wide `16 / 7` frame.
- production rendering now also normalizes standalone inline article images into figure-style blocks with controlled spacing, so editorial SVGs do not sit too early or too tightly against section headings.
- production rendering now avoids adding an extra visible frame around hero covers, so large editorial SVGs can read as the article's main image instead of as a smaller card inside another card.

## Latest Published Change

Текущим change-set добавлена статья:

- `content/ratgeber/wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax.md`

И связанные иллюстрации:

- `content/images/ratgeber/wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax-cover.svg`
- `content/images/ratgeber/wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax-workflow.svg`

## Current Master Baseline

- Current good backup baseline: `fa1c42d11a995127f3be253eb94477252e4c79ff`
- `origin/master = origin/autobot = fa1c42d11a995127f3be253eb94477252e4c79ff`
- The main local checkout at `C:\projects\utildesk-motia` was cleaned and aligned to the same commit.
- Treat this state as the current safe restore point for the repo and the site.

## 2026-04-22 SEO And Production State

- GSC access for `tools.utildesk.de` is verified via the service account on host `utildesk`.
- Major technical indexing noise came from sitemap pollution:
  - 6 alias tool URLs were still present in sitemap while returning live `308` redirects to canonical tool pages;
  - `/tools/tag/` was emitted into sitemap even though it is a route namespace and returned `404`.
- Production fix shipped:
  - alias tool pages disabled: `deepart-io`, `google-cloud-vision-api`, `google-data-studio`, `openai-chatgpt`, `right-inbox`, `swagger-ui`;
  - old internal alias link in `content/tools/grok.md` updated to `/tools/chatgpt/`;
  - `site/scripts/generate_sitemap.mjs` hardened to skip reserved tool namespace `tag`.
- Post-deploy live verification:
  - `https://tools.utildesk.de/sitemap.xml` now contains `855` URLs instead of `862`;
  - full live sitemap audit now reports `855 x 200 OK`, `0` redirects inside sitemap, `0` canonical mismatches, `0` 404s.
- Production branch health after the fix:
  - `origin/master = origin/autobot = a8504ce5f6112921c62f3878045ef5d582f049a4`;
  - `/opt/utildesk-motia` on host `utildesk` was fast-forwarded to the same commit on branch `autobot`.
- `Ratgeber` live state is technically healthy:
  - `/ratgeber/` and all 3 live articles return `200`, self-canonical, and no `noindex`;
  - the newest article is present in live sitemap.
- Residual GSC note:
  - URL Inspection still shows stale historical states for some alias URLs and the newest `ratgeber` article;
  - this is recrawl lag, not a current live-site blocking issue.

## 2026-04-22 AI Retrieval Readiness

- The site now ships a dedicated machine-readable discovery layer for AI crawlers and agents:
  - `/llms.txt`
  - `/llms-full.txt`
  - `/feed.xml`
  - `/feed.json`
  - `/api/tools.json`
  - `/api/ratgeber.json`
- Canonical content now also has page-level machine mirrors:
  - `/markdown/tools/<slug>.md`
  - `/markdown/ratgeber/<slug>.md`
  - `/api/tools/<slug>.json`
  - `/api/ratgeber/<slug>.json`
- Key HTML pages now advertise these resources directly via `rel="alternate"` links.
- Sitewide robots/meta defaults were hardened for modern search and AI retrieval:
  - `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`
  - explicit allow-groups in `robots.txt` for `OAI-SearchBot`, `GPTBot`, `ClaudeBot`, and `Google-Extended`
- Non-HTML agent endpoints intentionally send `X-Robots-Tag: noindex` so they remain fetchable without polluting normal search index coverage.
- JSON-LD coverage was expanded on homepage, tools index, category pages, tag pages, tool detail pages, and `ratgeber` pages.
- Content loading is now resilient on Windows/non-symlink checkouts:
  - `site/src/lib/contentRoot.mjs` resolves the real `content` root even when `site/content` is a plain pointer file instead of a symlink.
- Verified local build after these changes:
  - `npm --prefix site run build`
  - `1132` pages built
  - sitemap regenerated successfully with `855` URLs.

## 2026-04-22 Bing Webmaster Readiness

- A safe local Bing Webmaster access path is now prepared for `tools.utildesk.de`.
- The real key is expected only in the git-ignored local file:
  - `C:\projects\utildesk-motia\secrets\bing-webmaster.env`
- Operational helper script:
  - `scripts/bing_webmaster_api.py`
- Current supported local operations:
  - smoke validation via `GetUrlSubmissionQuota`
  - quota check
  - sitemap/feed submission
  - single-URL submission
  - generic method calls against Bing Webmaster JSON API
- Important limitation:
  - Bing still has no public URL Inspection API equivalent to GSC URL Inspection API, so deep per-URL inspection may still require the Bing Webmaster UI.

## 2026-04-22 Bing SEO Final State

- Current verified healthy production baseline after the Bing pass:
  - `HEAD = origin/master = origin/autobot = 2926dccb2dc760135835d681b41f71b6e93c571a`
- Bing Webmaster access is confirmed and operational through `secrets/bing-webmaster.env`.
- Bing property health after the fixes:
  - `GetCrawlIssues` returns no active crawl issues;
  - last-30-day crawl summary shows `0` days blocked by robots and `0` days with `5xx`;
  - Bing's `InIndex` count is still growing (`321` in the latest crawl-stat snapshot).
- Bing sitemap state is now aligned with live production:
  - live `sitemap.xml` contains `855` URLs;
  - `GetFeedDetails` for `https://tools.utildesk.de/sitemap.xml` now reports `UrlCount = 855`;
  - Bing feed `Submitted` and `LastCrawled` timestamps refreshed on `2026-04-22`.
- Machine-readable helper endpoints are explicitly kept out of normal search indexing while staying fetchable:
  - `/feed.xml`
  - `/feed.json`
  - `/llms.txt`
  - `/llms-full.txt`
  - `/api/*`
  - `/markdown/*`
- Important implementation detail:
  - `_headers` stays as a static fallback;
  - the reliable live enforcement now runs through Cloudflare Pages Functions in `site/functions/`.
- HTML production pages remain indexable after the change:
  - homepage, tool detail pages, `ratgeber` index, and live articles still return `200` with normal `index,follow` meta robots.

- remote production head на момент публикации: `origin/master = 2130ee6`
- локальная старая рабочая копия пользователя не является надёжным baseline для публикации
- для manual content-release использовать отдельный чистый worktree от актуального `origin/master`
