# Handoff



## 2026-05-15 Umami v3.1.0 operations handoff

- Umami for `stats.utildesk.de` runs on SSH host `utildesk` as root, path `/opt/umami`.
- Docker Compose image is pinned to `docker.umami.is/umami-software/umami:3.1.0`; do not drift back to floating `postgresql-latest` without a reason.
- Database service is PostgreSQL 16 in container `umami-db`; app service is `umami`; Traefik exposes `stats.utildesk.de`.
- Rollback assets from the upgrade are under `/opt/umami/backups/pre-v3.1.0-20260515T154952Z/`, including the previous compose file, full root-only env copy, Docker inspect output, and custom-format `pg_dump`.
- Successful post-upgrade checks: compose running, logs show `umami@3.1.0`, Prisma migrations 15-19 applied, heartbeat/script/root all HTTP 200, browser smoke request produced `/api/send` 200 and fresh `website_event` row.
- Do not enable Session Replay casually. Treat it as a separate privacy/GDPR change because v3.1.0 adds replay support.

## 2026-05-13 E2a Ratgeber publication handoff

- User-approved candidate: `20260511-e2a-open-source-email-gateway-for-ai-agents-how_to-bb2d056d`.
- Live URLs:
  - `https://tools.utildesk.de/ratgeber/e2a-open-source-email-gateway-for-ai-agents-so-gelingt-der-einsatz-in-der-praxis/`
  - `https://tools.utildesk.de/en/ratgeber/e2a-open-source-email-gateway-for-ai-agents-so-gelingt-der-einsatz-in-der-praxis/`
- Content was first published in `6141cfbf`; final user-approved imagery is in `84f6ae24` with new `-chagall.webp` filenames to avoid CDN cache collisions.
- Final art direction: poetic early-modernist / Chagall-inspired dream scenes about email as a trusted bridge between a human operator and an AI agent. Keep this as mood inspiration only; do not copy known artworks, signatures, or direct compositions.
- Final asset sizes: cover `200798` bytes, workflow `172430` bytes, both WebP at `1536x864`.
- Candidate was marked `published` through the Cloudflare Ratgeber upload API, and machine queues returned `publishPending=0`, `reworkPending=0`.
- Final validation for the release: editorial check, EN translation check, Astro build on `2844` pages, live DE/EN page check, and direct image asset check.
- Operational caution: this work happened while Ubuntu continues producing/publishing tool-card illustrations. Keep Ratgeber publication changes isolated from tool-card batches and do not stage unrelated generated build manifests.

## 2026-05-11 Ubuntu Deploy And Laptop Sync Helpers

- Added a guarded remote-deploy flow so the Ubuntu worker can publish clean committed work directly once its GitHub credential has write access.
- New files:
  - `scripts/deploy_from_ubuntu.sh`
  - `scripts/sync_after_remote_deploy.ps1`
  - `scripts/publish_hub_ref_from_windows.ps1`
  - `docs/04_operations/ubuntu_deploy_sync.md`
- Direct Ubuntu path:
  - `cd ~/projects/utildesk-motia-worker`
  - `source ~/utildesk-chatgpt-worker/env.sh`
  - commit content plus memory/handoff
  - `bash scripts/deploy_from_ubuntu.sh`
- Hub fallback path while GitHub push is unavailable from Ubuntu:
  - `bash scripts/deploy_from_ubuntu.sh --hub-only`
  - then run the printed `scripts/publish_hub_ref_from_windows.ps1 -HubRef ...` command on the laptop.
- Laptop sync path after any remote deploy:
  - `powershell -ExecutionPolicy Bypass -File scripts/sync_after_remote_deploy.ps1 -SyncHub`
- The laptop sync helper fast-forwards the main checkout only when it is clean. If the main checkout is dirty, it leaves it untouched and updates the clean production-memory mirror at `C:\projects\utildesk-motia-production-sync`.
- Future agents should treat GitHub `origin/master` plus tracked project memory as the source of truth after Ubuntu deploys, not the dirty main checkout alone.

## 2026-05-11 Ableton Live Tool Editorial Rewrite

- Ubuntu worker `jgdus-optiplex-3000` produced a manual editorial rewrite for `ableton-live`.
- Production files in this change:
  - `content/tools/ableton-live.md`
  - `content/en/tools/ableton-live.md`
  - `content/images/tools/ableton-live-editorial.webp`
  - `docs/04_operations/tool_card_editorial_registry.json`
  - `docs/04_operations/tool_card_illustration_registry.json`
  - `memory/recent_changes.md`
- The update rewrites the old production-generated card into a more practical German/English tool article and adds one PNG-to-WebP artistic tool-card illustration.
- The slug is now registered in both the manual editorial registry and the illustration registry, so future batches should skip it unless the user explicitly asks for another revision.
- Handoff path used:
  - Ubuntu commit: `0163437` (`content: update Ableton Live tool card`);
  - exchange branch: `hub/codex/ableton-live-editorial-20260511`;
  - clean deploy worktree on the laptop: `C:\projects\utildesk-motia-deploy-ableton-live-20260511`.

## 2026-05-11 Clip Studio Paint Tool Illustration

- Ubuntu worker `jgdus-optiplex-3000` created one approved artistic tool-card illustration for `clip-studio-paint`.
- Production files in this change:
  - `content/images/tools/clip-studio-paint-editorial.webp`
  - `content/tools/clip-studio-paint.md`
  - `content/en/tools/clip-studio-paint.md`
  - `docs/04_operations/tool_card_illustration_registry.json`
  - `memory/recent_changes.md`
- The artwork follows the tool-card PNG-to-WebP scheme, not the Ratgeber SVG/diagram scheme.
- The image is inserted as a single image-only `tool-editorial-figure` in both DE and EN pages, with no figcaption.
- Raw/browser generation happened on the Ubuntu ChatGPT profile; only the final WebP and content metadata are committed.
- Handoff path used for this offload:
  - Ubuntu branch: `codex/clip-studio-paint-illustration-20260511`
  - exchange remote: `hub/codex/clip-studio-paint-illustration-20260511`
  - clean deploy worktree on the laptop: `C:\projects\utildesk-motia-deploy-clip-studio-20260511`

## 2026-04-22 SEO Handoff

- Current good backup baseline:
  - commit `fa1c42d11a995127f3be253eb94477252e4c79ff`
  - `origin/master = origin/autobot = fa1c42d11a995127f3be253eb94477252e4c79ff`
  - local main checkout was cleaned and aligned to the same commit
- Fixed a Windows-hostile git tree detail:
  - removed the case-only duplicate markdown path `scripts/AUDIT_ALTERNATIVES_RENDER.md`;
  - kept the canonical doc as `scripts/audit_alternatives_render.md` and updated it to match the real CLI options.
- Deep SEO audit outcome:
  - the big live technical problem was sitemap pollution, not robots/noindex blocking;
  - 6 alias tool URLs in sitemap redirected with `308` to canonical tool pages;
  - `/tools/tag/` was an invalid sitemap URL and returned `404`.
- Implemented fix:
  - disabled the 6 alias tool markdown files;
  - updated the old internal ChatGPT alias link in `grok.md`;
  - updated `site/scripts/generate_sitemap.mjs` to exclude the reserved `tag` namespace;
  - fixed `scripts/sync_autobot_to_master_ff.sh` so it works even when no local `autobot` branch exists.
- Verified post-deploy:
  - live sitemap now has `855` URLs;
  - full live sitemap audit reports `0` bad URLs;
  - alias URLs still redirect correctly;
  - `ratgeber` index and live articles are canonical and indexable.
- Production branch state is healthy again:
  - `origin/master` and `origin/autobot` are synced to `a8504ce5f6112921c62f3878045ef5d582f049a4`;
  - `/opt/utildesk-motia` on `utildesk` was pulled forward to the same commit.
- Residual note:
  - Search Console URL Inspection still reflects stale historical crawl states for some old alias URLs and the newest article; this needs recrawl time, not another live-site fix right now.

## What Changed

- Добавлен безопасный import approved `ratgeber` packages: `scripts/import_ratgeber_package.py`
- Зафиксирован ops-guardrail: `tools` cron и `ratgeber` publish должны жить раздельно
- Добавлен runbook: `docs/04_operations/ratgeber_publish.md`
- Импортирована и подготовлена к production release статья `wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax`
- Fixed production `ratgeber` rendering regression:
  - the top cover image now opens in the shared lightbox just like inline article images;
  - the hero cover no longer gets compressed inside a forced wide aspect-ratio box.
- Refined the latest article's editorial visuals:
  - the workflow illustration was moved lower in the article flow so it no longer interrupts the transition from the related-tools section into the next chapter;
  - the workflow SVG was rebuilt so the subtitle no longer collides with the card graphics;
  - the cover SVG was rebuilt with a denser composition so the page can render it larger without excessive empty framing;
  - the hero-cover wrapper in the production template now avoids adding a second visible frame around the artwork.

## 2026-04-22 AI Retrieval Handoff

- Goal of this pass:
  - make `tools.utildesk.de` materially easier to consume for AI crawlers, AI search, and autonomous agents without harming normal SEO.
- Implemented site-level machine-readable layer:
  - `site/src/pages/llms.txt.ts`
  - `site/src/pages/llms-full.txt.ts`
  - `site/src/pages/feed.xml.ts`
  - `site/src/pages/feed.json.ts`
  - `site/src/pages/api/tools.json.ts`
  - `site/src/pages/api/ratgeber.json.ts`
  - `site/src/pages/api/tools/[slug].json.ts`
  - `site/src/pages/api/ratgeber/[slug].json.ts`
  - `site/src/pages/markdown/tools/[slug].md.ts`
  - `site/src/pages/markdown/ratgeber/[slug].md.ts`
- Implemented shared helpers:
  - `site/src/lib/siteMeta.ts`
  - `site/src/lib/machineReadable.ts`
  - `site/src/lib/contentRoot.mjs`
- Important rendering and metadata changes:
  - `BaseLayout` now emits stronger robots directives, richer Open Graph/Twitter meta, and global alternate links to feeds, catalogs, and AI manifests;
  - homepage, tools index, categories, tags, tool detail pages, and `ratgeber` pages now emit richer JSON-LD including collection and breadcrumb schemas;
  - tool and article detail pages now expose both Markdown and JSON alternates for the exact page.
- Important build-system hardening:
  - content loading no longer assumes `site/content` is a symlink;
  - Windows checkouts where `site/content` is a pointer file now build correctly via `contentRoot.mjs`.
- Verification completed:
  - `npm --prefix site run build` passed;
  - final build produced `1132` pages;
  - postbuild sitemap generation passed with `855` URLs;
  - generated output contains working `llms`, feed, catalog, Markdown, and page-level JSON artifacts.

## 2026-04-22 Bing Webmaster Handoff

- Prepared a safe local Bing Webmaster credential path for `tools.utildesk.de`:
  - git-ignored secret file: `secrets/bing-webmaster.env`
- Added helper script:
  - `scripts/bing_webmaster_api.py`
- Added runbook:
  - `docs/04_operations/bing_webmaster_access.md`
- Added script overview note:
  - `scripts/README.md`
- Local validation completed:
  - `python -m py_compile scripts/bing_webmaster_api.py` passed
  - `python scripts/bing_webmaster_api.py smoke` fails cleanly with a missing-key message until the real key is inserted
- Also stored the local access note in the Codex SEO skill:
  - `C:\Users\sserg\.codex\skills\tools-seo-master\references\bing-access.md`

## 2026-04-22 Bing SEO Completion Handoff

- Verified Bing access with the real local key:
  - `python scripts/bing_webmaster_api.py smoke`
  - `python scripts/bing_webmaster_api.py sites`
  - `python scripts/bing_webmaster_api.py feeds`
  - `python scripts/bing_webmaster_api.py crawl-summary --days 30`
- Confirmed root-cause findings:
  - no active Bing crawl-issue cluster;
  - no robots or `5xx` blocking in recent crawl stats;
  - the remaining Bing mismatch was stale sitemap/feed state plus machine endpoints missing live `X-Robots-Tag`.
- Shipped two production fixes:
  - `site/public/_headers` now declares `X-Robots-Tag: noindex` for machine endpoints;
  - Cloudflare Pages Functions now enforce that header live for:
    - `/feed.xml`
    - `/feed.json`
    - `/llms.txt`
    - `/llms-full.txt`
    - `/api/*`
    - `/markdown/*`
- Improved Bing operations helper:
  - added `sites`
  - added `feeds`
  - added `crawl-summary`
  - added `submit-batch`
  - corrected docs to use `GetUserSites`, not `GetSiteList`
- Live production verification after deploy:
  - machine endpoints now return `X-Robots-Tag: noindex`;
  - normal HTML pages still return `200` without header-level `noindex` and keep the expected `index,follow` meta robots.
- Bing re-submission completed after the live fix:
  - sitemap re-submitted;
  - batch submission sent for `/`, `/tools/`, `/tools/chatgpt/`, `/ratgeber/`, and the latest published article.
- Bing feed state after re-submission:
  - `GetFeedDetails` now shows `UrlCount = 855`
  - `Status = Success`
  - refreshed `Submitted` and `LastCrawled` timestamps on `2026-04-22`
- Branch health after the manual SEO pass:
  - `origin/master = origin/autobot = 2926dccb2dc760135835d681b41f71b6e93c571a`

## 2026-04-23 IndexNow Completion Handoff

- Added public root verification key file for IndexNow:
  - `site/public/c8e698e7-44e8-41e1-86d5-594ba2697475.txt`
- Added helper:
  - `scripts/indexnow_submit.py`
- Added docs:
  - `docs/04_operations/indexnow.md`
  - updated `docs/04_operations/ratgeber_publish.md`
  - updated `scripts/README.md`
- Helper behavior:
  - auto-discovers the repo-tracked root key file;
  - verifies that the live key file is reachable and correct;
  - submits URL batches to `https://api.indexnow.org/indexnow`;
  - can derive canonical HTML URLs from `git` ranges for safe post-release notifications.
- Tools automation:
  - `scripts/cron_publish_push.sh` now runs a non-blocking post-deploy IndexNow submit by default;
  - it waits for live availability and submits only URLs derived from the latest tools commit.
- Live verification completed:
  - key file became reachable on `https://tools.utildesk.de/c8e698e7-44e8-41e1-86d5-594ba2697475.txt`
  - `python scripts/indexnow_submit.py smoke` succeeded
  - first live submission for `/`, `/tools/`, `/ratgeber/`, and the latest article returned `202 Accepted`
- Operational note:
  - `202` is acceptable for the first submission because IndexNow may still be validating the new key file;
  - later submissions should normally move to `200` once validation is cached.
- Follow-up completion on the same day:
  - `scripts/indexnow_submit.py` now submits to both the global IndexNow endpoint and the direct Bing endpoint;
  - a live re-submit returned `200` from both endpoints for `/`, `/tools/`, `/ratgeber/`, and the latest article;
  - `scripts/cron_publish_push.sh` was corrected so the post-deploy IndexNow hook is not skipped by an earlier successful `exit 0`.


## Release Note

Если понадобится следующая article release:

1. взять approved package с `opcl`
2. открыть чистый checkout от свежего `origin/master`
3. выполнить `python scripts/import_ratgeber_package.py --package-dir ...`
4. проверить diff только по `content/ratgeber` и `content/images/ratgeber`
5. коммитить и публиковать отдельно от `tools`


## 2026-05-12 Video AI tools / Ratgeber publication handoff

- Published Vyrill, Naoma AI, and Hera as full DE/EN tool cards from the multimodal agents Ratgeber mentions.
- Sheet rows are released: `vyrill` row 1646 DONE, `naoma-ai` row 1647 DONE, `hera` row 1648 DONE.
- Production content commit is `8bc2854`; live pages all returned 200 after a direct Wrangler Pages deployment.
- Direct deploy was needed because GitHub push did not make the new pages live during the polling window. Use local `C:\projects\utildesk-motia\.env` for `CLOUDFLARE_API_TOKEN`; never print or commit its value.
- Hub/Ubuntu sync is the remaining mechanical follow-up: Tailscale SSH to `jgdus@100.98.97.98` requested an additional browser check and blocked `git push hub`. After re-auth, run `powershell -NoProfile -ExecutionPolicy Bypass -File C:\projects\utildesk-motia-production-sync\scripts\sync_after_remote_deploy.ps1 -Repo C:\projects\utildesk-motia -SyncHub`.

## 2026-05-12 Repair note: no quick tool-card scheme

- The first Vyrill/Naoma AI/Hera publication used a too-short emergency card pattern; this is now explicitly deprecated and recorded in `memory/decisions.md`.
- The current repair expands all six files (`content/tools/*` and `content/en/tools/*`) to the full editorial catalogue standard with renderable alternatives and FAQ.
- Keep this as the baseline for future urgent tool publications: if the full structure cannot be produced, the tool should remain blocked instead of being published as a minimal card.
