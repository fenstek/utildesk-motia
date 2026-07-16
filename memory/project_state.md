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

## 2026-05-06 Search Sitemap Split Contract

- Production now uses a compact sitemap strategy during search recovery, focused on Ratgeber depth and the strongest tool cards.
- Google / robots / GSC contract:
  - public advertised sitemap: `https://tools.utildesk.de/sitemap.xml`;
  - `site/public/robots.txt` must advertise only this compact sitemap;
  - this sitemap contains the focused Google-quality surface only: core hubs, methodology pages, Ratgeber, and a small curated set of strong tool cards.
- Bing contract:
  - explicit Bing feed: `https://tools.utildesk.de/sitemap-focus.xml`;
  - `sitemap-bing.xml` mirrors the compact focus surface only and must not be used as a broad long-tail feed;
  - do not advertise Bing/focus feeds in `robots.txt`; submit the focus feed explicitly through Bing Webmaster API/UI only when we intentionally want to refresh Bing.
- Tool page robots contract:
  - long-tail tool pages must not receive global `<meta name="robots" content="noindex,...">` just because Google is being staged;
  - long-tail pages should keep generic `robots = index,follow` and receive `googlebot = noindex,follow` only when excluded from the Google sitemap;
  - explicit frontmatter `search_index: false`, `indexable: false`, or `index: false` remains a real global noindex.
- Implementation points:
  - `site/src/lib/searchIndexPolicy.mjs` returns both `robots` and optional `googlebotRobots`;
  - `site/src/layouts/BaseLayout.astro` emits `<meta name="googlebot">` only when provided;
  - German and English tool detail routes pass `googlebotRobots` from the policy;
  - `scripts/bing_webmaster_api.py` defaults feed submission to `/sitemap-focus.xml`;
  - `docs/04_operations/bing_webmaster_access.md` documents the split.
- Operational guardrail:
  - do not reintroduce a broad long-tail sitemap without explicit approval;
  - do not "simplify" Google staging by globally noindexing long-tail pages, because that also damages Bing;
  - if Bing is healthy, do not resubmit feeds reflexively during Google-only fixes.

## 2026-04-23 IndexNow State

- IndexNow is now enabled for `tools.utildesk.de`.
- Public root verification key file:
  - `https://tools.utildesk.de/c8e698e7-44e8-41e1-86d5-594ba2697475.txt`
  - source file in repo: `site/public/c8e698e7-44e8-41e1-86d5-594ba2697475.txt`
- Operational helper:
  - `scripts/indexnow_submit.py`
- Current helper capabilities:
  - verify the live key file (`smoke`)
  - submit arbitrary URL batches
  - derive canonical HTML URLs from `git diff` ranges and submit them
  - wait until the key file and submitted URLs are live before notifying the protocol endpoint
- Tools publish automation:
  - `scripts/cron_publish_push.sh` now includes a non-blocking post-deploy IndexNow step by default;
  - it submits URLs derived from `HEAD~1..HEAD` after a tools release.
- Manual `ratgeber` releases remain separate:
  - after push, run `python scripts/indexnow_submit.py submit-git-range --rev-range HEAD~1..HEAD --wait-live`
- Live verification completed on `2026-04-23`:
  - `python scripts/indexnow_submit.py smoke` succeeded against the public key file;
  - first live batch submission for `/`, `/tools/`, `/ratgeber/`, and the latest article returned `202 Accepted`, which matches initial key-validation handling in the protocol.
- Follow-up hardening completed on `2026-04-23`:
  - `scripts/indexnow_submit.py` now submits to both `https://api.indexnow.org/indexnow` and the direct Bing endpoint `https://www.bing.com/indexnow`;
  - `scripts/cron_publish_push.sh` was fixed so the post-deploy IndexNow hook runs from the real synced-publish path, not only from the tail of the script.
- Direct re-check completed on `2026-04-23`:
  - both endpoints now returned `200 OK` for a live batch containing `/`, `/tools/`, `/ratgeber/`, and the latest article.

- remote production head на момент публикации: `origin/master = 2130ee6`
- локальная старая рабочая копия пользователя не является надёжным baseline для публикации
- для manual content-release использовать отдельный чистый worktree от актуального `origin/master`

## 2026-04-24 Ratgeber Autonomy State

- Ratgeber production is still deliberately separated from the `tools` cron.
- The article factory lives on `opcl` at:
  - `/opt/openclaw/workspace/agent-newsman`
- Current article pipeline components on `opcl`:
  - daily intel/news collection writes `data/article_jobs/latest_run.json`;
  - `scripts/article_orchestrator.py` converts ready signals into queue jobs;
  - NotebookLM article runner writes artifacts under `artifacts/article_jobs/*`;
  - `scripts/article_rewrite_runner.py` can do automated rewrite passes;
  - `scripts/article_review_queue.py` exposes review-ready packets;
  - `scripts/export_ratgeber_package.py` exports approved packages into `publish_ready/ratgeber/*`.
- Current observed scheduler state:
  - user crontab on `opcl` has daily `openclaw-newsman-daily`;
  - hourly article runner / rewrite runner scripts exist but were not observed in the user crontab.
- The site-side import gate was hardened:
  - `scripts/import_ratgeber_package.py --preflight-only` validates package approval, frontmatter, article quality, visual quality, duplicate risk, image paths, source links, related tools, and NotebookLM citation residue;
  - `--strict-warnings` treats warnings as blockers and is the intended mode for a future autonomous publisher.
- The `opcl` exporter was adjusted so future secondary article illustrations are injected later in the article:
  - target is after at least 2 substantive H2 sections and at least 320 words before the image;
  - backup on `opcl`: `/opt/openclaw/workspace/agent-newsman/scripts/export_ratgeber_package.py.bak-20260424-autonomy`.

## 2026-04-24 Ratgeber NotebookLM Autonomy Loop

- NotebookLM is the article-writing stage between queued jobs and review artifacts:
  - `scripts/article_orchestrator.py` creates jobs only from mature `article_job_suggestions`;
  - `article_execution/article_runner.py` creates a NotebookLM notebook, adds the editorial brief and sources, writes the article, renders illustrations, and emits `review_packet.json`;
  - `scripts/article_rewrite_runner.py` runs conservative NotebookLM rewrite passes until the artifact becomes `review_ready` or attempts are exhausted;
  - `scripts/article_review_server.py` serves the candidate in the final article layout for human review before publication.
- `opcl` crontab now runs the autonomous loop:
  - `20 * * * *` article orchestrator, limit 1;
  - `35 * * * *` NotebookLM article runner, limit 1;
  - `45 * * * *` NotebookLM rewrite runner, limit 1;
  - `*/10 * * * *` review server watchdog for `127.0.0.1:18123`.
- Current review UI access from the Windows workstation:
  - SSH tunnel: `ssh -N -o ExitOnForwardFailure=yes -L 18123:127.0.0.1:18123 opcl`;
  - browser URL: `http://127.0.0.1:18123/`.
- Current generated candidate:
  - job id: `20260424-ist-deine-website-bereit-f-r-ki-agenten-how_to-5d6c5491`;
  - final preview: `http://127.0.0.1:18123/candidate/20260424-ist-deine-website-bereit-f-r-ki-agenten-how_to-5d6c5491`;
  - status: `review_ready`;
  - article quality: score `100`, blockers `0`, issue codes `[]`, word count `1204`, section count `6`;
  - visual quality: cover `orchestration_v2`, workflow `howto_workflow`, all visual gates passing.
- `opcl` rewrite runner was hardened for autonomy:
  - backup before entity grounding prompt: `/opt/openclaw/workspace/agent-newsman/scripts/article_rewrite_runner.py.bak-20260424-entity-rewrite`;

## 2026-04-26 English i18n Foundation

- The site is now German-first with an English public layer under `/en/`.
- Localized routes cover homepage, tools index/detail, categories, tags, Ratgeber index/detail, privacy, imprint, feeds, JSON APIs, Markdown mirrors, and `llms` files.
- English Ratgeber articles live in `content/en/ratgeber/*.md`.
- Tool pages use an English generated catalogue layer from `site/src/lib/englishContent.ts`.
- SEO contract:
  - every localized HTML page should have a self-canonical URL;
  - German and English siblings should be connected through `hreflang`;
  - sitemap generation reads built pages and includes English public URLs.
- Ratgeber publish contract:
  - `scripts/import_ratgeber_package.py` can import an English sibling article from package metadata or conventional package filenames;
  - `scripts/ratgeber_cloudflare_publish_consumer.py` calls the importer with `--require-english`;
  - autonomous publication should not create German-only Ratgeber drift after this rollout.
  - backup before weak-intro prompt: `/opt/openclaw/workspace/agent-newsman/scripts/article_rewrite_runner.py.bak-20260424-weak-intro`;
  - rewrite prompts now preserve article length/closing sections and add issue-specific rules for `missing_concrete_entities` and `weak_intro`.

## 2026-04-24 Cloudflare Ratgeber Review Backend

- A private Cloudflare Pages backend now exists for Ratgeber candidates:
  - public route, protected by a normal `/admin/ratgeber/login` password form and HttpOnly session cookie: `https://tools.utildesk.de/admin/ratgeber/`;
  - current candidate route: `https://tools.utildesk.de/admin/ratgeber/candidate/20260424-ist-deine-website-bereit-f-r-ki-agenten-how_to-5d6c5491`;
  - machine upload endpoint uses the Pages domain to avoid the public-domain browser-signature WAF: `https://utildesk-motia.pages.dev/admin/ratgeber/api/upload`.
- Secrets:
  - local gitignored file: `secrets/ratgeber_review_backend.env`;
  - copied to `opcl`: `/opt/openclaw/workspace/agent-newsman/auth/utildesk_ratgeber_review.env`;
  - Cloudflare Pages secrets: `RATGEBER_REVIEW_USER`, `RATGEBER_REVIEW_PASSWORD`, `RATGEBER_UPLOAD_TOKEN`.
- Storage:
  - Cloudflare KV namespace binding: `RATGEBER_REVIEW`;
  - namespace id: `0648e73366e04931a03af182c7894603`.
- Code added in this repo:
  - `site/functions/admin/ratgeber/*` implements the protected review UI, asset serving, upload API, publish-queue API, and publish button;
  - `scripts/ratgeber_cloudflare_candidate_sync.py` renders PNG candidate artwork and uploads candidates from `opcl`.
- 2026-04-25 auth fix:
  - HTTP Basic Auth caused Chrome to hit `ERR_TOO_MANY_RETRIES` on the admin route;
  - the admin UI now redirects unauthenticated browser requests to `/admin/ratgeber/login`;
  - Basic Auth remains only as a fallback for non-browser checks, while machine upload still uses `RATGEBER_UPLOAD_TOKEN`;
  - direct Pages deploy `66fa2ab7` was used after Git deploy propagation kept serving the previous middleware.
- `opcl` article rendering/publishing algorithms now prefer PNG assets:
  - `scripts/article_review_server.py` prefers `cover.png` / `workflow.png` in final previews, with SVG only as fallback;
  - `scripts/export_ratgeber_package.py` exports `cover.png` / `workflow.png` into publish-ready packages when present, with SVG only as fallback;
  - backups before the PNG preference patch:
    - `/opt/openclaw/workspace/agent-newsman/scripts/export_ratgeber_package.py.bak-20260424-png-assets`;
    - `/opt/openclaw/workspace/agent-newsman/scripts/article_review_server.py.bak-20260424-png-assets`.
- `opcl` crontab runs Cloudflare candidate sync:
  - `55 */6 * * * cd /opt/openclaw/workspace/agent-newsman && RATGEBER_REVIEW_UPLOAD_ENDPOINT=https://utildesk-motia.pages.dev/admin/ratgeber/api/upload ./.venv/bin/python scripts/ratgeber_cloudflare_candidate_sync.py --all-review-ready --limit 10 --token-env auth/utildesk_ratgeber_review.env >> logs/ratgeber_cloudflare_sync.log 2>&1`
- 2026-04-28 KV protection fix:
  - Ratgeber candidate uploads now carry a stable `uploadSignature`;
  - `scripts/ratgeber_cloudflare_candidate_sync.py` skips unchanged local candidates before POSTing to Cloudflare;
  - `/admin/ratgeber/api/upload` skips KV asset/candidate writes when the incoming signature matches the stored one;
  - `opcl` Cloudflare candidate sync cron is intentionally reduced from hourly to every 6 hours: `55 */6 * * *`.
- Current candidate was uploaded with PNG assets:
  - `cover.png`;
  - `workflow.png`.

## 2026-04-25 Ratgeber Publish Consumer

- Ratgeber publish button creates Cloudflare KV queue items under `ratgeber-review:publish-queue:*`.
- `scripts/ratgeber_cloudflare_publish_consumer.py` is the safe consumer for those queue items:
  - approves the selected `opcl` artifact via `scripts/article_review_decision.py`;
  - exports it with `scripts/export_ratgeber_package.py`;
  - imports it into a fresh isolated checkout with `scripts/import_ratgeber_package.py --preflight-only --strict-warnings`;
  - commits/pushes only if the git diff is limited to `content/ratgeber/*.md` and `content/images/ratgeber/*`;
  - refuses to touch `content/tools/*`, so the tools production publisher remains isolated.
- The import gate now rejects residual NotebookLM numeric citation ranges such as `[1-3]`, `[1–3]`, and `[24, 26-28]` in both frontmatter and body.
- The 2026-04-24 article `ist-deine-website-bereit-fur-ki-agenten-so-gelingt-der-einsatz-in-der-praxis` was cleaned of visible citation residue before redeploy.
- `opcl` has an active `openclaw-ratgeber-publish-consumer` cron every 5 minutes, isolated under `/opt/openclaw/workspace/ratgeber-publisher`.
- As of setup time, `opcl` can read GitHub but cannot push to `fenstek/utildesk-motia` over HTTPS without an added `GITHUB_TOKEN` or SSH/deploy key; the consumer performs `git push --dry-run` before changing a queue item to `publishing`, so missing credentials leave requests pending instead of touching production.

## 2026-07-12 Current Ratgeber candidate-factory runtime

- Runtime host: physical OptiPlex, `jgdus@100.98.97.98:/home/jgdus/projects/agent-newsman`.
- NotebookLM profile: paid `vasjakotov11@gmail.com`, `NOTEBOOKLM_HOME=/home/jgdus/.notebooklm`, refreshed from the authenticated Chrome CDP session before every CLI stage.
- Active stages: source inbox 07:15, daily discovery 08:00, hourly research bridge/orchestrator/runner/rewrite, local review server, six-hour private Cloudflare review sync, and publish/rework queue consumers.
- `opcl` has no active `agent-newsman` cron after the migration. Historical `opcl` descriptions above are retained as history and must not be treated as current topology.
- Latest end-to-end factory proof: Shared AI Workspaces candidate `20260712-shared-ai-workspaces-wie-teams-kontext-memory-und-agentenraeume--trend_piece-6b68f8e3`, NotebookLM notebook `445b5a3b-a946-45db-85a3-1b7064fece3b`, article QA 100, status `review_ready`.

## 2026-07-15 Tool detail runtime migration preview state

- Branch `codex/tool-runtime-migration-20260714` contains the completed local preview stack through commits `1aaf13d2`..`ff7104a5`: unified public state, D1 schema/publisher, shared detail view model, runtime routes/cache, parity gates, content-addressed assets, complete local D1 projection and a default-off Pages tool allowlist proxy.
- Verified public set is exactly 1228 DE and 1228 EN tool entries. The full local runtime crawl passed 2456/2456 canonical routes; the deduplicated resource audit passed 10,754 URLs with zero failures.
- Production remains unchanged. The available Cloudflare credential can inspect Pages project `utildesk-motia` but cannot access target D1/Worker ownership; the configured production Worker currently returns 404 for tool preview and canonical routes.
- Safe next operation requires the existing credential/account that owns D1 `259ed703-ba7c-4aba-a269-e167d391eae6` and Worker `utildesk-content-runtime`. Back up D1, apply migrations, publish the 20-slug cohort and deploy the Worker before activating the Pages KV allowlist.

## 2026-07-16 Tool runtime production architecture

- All 1,228 active DE and 1,228 active EN tool-detail routes are D1/Worker-owned behind the Pages `content-runtime:tools=on` switch. The independent `content-runtime:tool-shell=on` switch owns homepage, Tool Index, category and tag shells; Ratgeber remains independently controlled and was not changed by this release.
- Production Worker version is `585af87a-af2c-40cc-a13c-f20cb3e02cf0` (deployment `4884237a-ff6a-4147-a0a1-1c640ad56956`). Pages production deployment is `2e3addbc-c918-419b-bf2a-a23e2ac22f35` with source `57f770b`.
- D1 migrations `0001` through `0006` are applied. Collection revisions invalidate tool catalogs and shells monotonically; shell reads are metadata-only and revision-cached per isolate.
- Normal Astro builds emit no tool detail HTML and no per-tool JSON/Markdown mirrors. Frozen fallback tag `tool-runtime-fallback-20260714`, archive SHA-256 `8b292e374ef8b7af740ed72f7b2569ee86b7b3e748436a5aac75ec104b1ac511`, and fallback Pages deployment `44f4f878` remain the tested recovery path.
- Runtime DE/EN catalog, detail JSON and Markdown endpoints are fetchable and `noindex`. Delta publication is paired/atomic and quota-ledgered; remote `--all` is forbidden.
- R2 is not enabled in the Worker/D1 Cloudflare account (code 10042). Production assets therefore remain hash-verified Pages/frozen fallback; changed/new assets fail closed until an account owner enables R2.
- Bounded release evidence: 48-route production detail canary exact, 24-route machine delta green, corrected shell canary green, compact Google/Bing/focus sitemaps all 114 URLs, and 316/500 worst-case live requests charged including the conservative Git-alignment deployment reservation.
