# Recent Changes — utildesk-motia
_Last updated: 2026-06-12_

## 2026-06-12 - GSC sitemap noindex alert triage

- Investigated the Google Search Console email `WNC-20237597` about a new `Excluded by noindex tag` reason for pages in a sitemap.
- Live production check found the current `https://tools.utildesk.de/sitemap.xml` clean: 110 URLs, all HTTP 200, no `X-Robots-Tag: noindex`, no `robots noindex`, and no `googlebot noindex` on the submitted URLs.
- GSC API showed an obsolete `https://tools.utildesk.de/sitemap-focus.xml` submission still registered from 2026-06-03 even though the Google contract is only `sitemap.xml`; removed `sitemap-focus.xml` from GSC and resubmitted only `https://tools.utildesk.de/sitemap.xml`.
- Final GSC sitemap list after cleanup contained only `https://tools.utildesk.de/sitemap.xml`, `submitted=110`, `warnings=0`, `errors=0`; `robots.txt` still advertises only the main sitemap.
- Current diagnosis: the email is most likely a delayed/stale Search Console notification from earlier broad/focus sitemap history or historical submitted URLs, not a present live sitemap pollution issue.
- Follow-up safe patch aligned `tier_d_thin_or_unmonetized` tool pages with the split-search contract: generic `robots` now stays `index,follow`, while Google staging is expressed only through `googlebot: noindex,follow`. Explicit frontmatter noindex remains global noindex.

## 2026-06-12 - Ratgeber-linked tool-card gap pass and public GitHub mentions

- Audited all Ratgeber/internal-cluster `/tools/` references at body level instead of trusting legacy `editorial_reviewed` metadata alone; the pass found 81 unique internally linked tool slugs, 38 weak cards, and 2 external source-link false positives that were not Utildesk tool pages.
- Manually strengthened the 38 weak DE/EN tool cards with cluster-specific editorial sections, workflow fit, risk checks, internal alternatives, FAQ coverage where missing, refreshed lastmod metadata, and batch marker `2026-06-12-ratgeber-linked-tool-gap-pass`.
- Updated the editorial registry and `site/src/data/content-lastmod.json`; validation passed with `npm run check:editorial`, `node scripts/check_english_tool_translations.mjs`, `npm run check:tool-quality`, and `npm --prefix site run build`.
- Added relevant Utildesk mentions/backlinks only to public GitHub repositories where the context fit: `fenstek/opcl` -> OpenClaw card and open-source agents comparison, `fenstek/obsidian-llm-wiki-local` -> persistent AI memory guide, and `fenstek/claude-code-starter` -> coding agents guide plus Claude/Codex cards.

## 2026-06-11 - KI-Browser NotebookLM Ratgeber publication

- Retrieved NotebookLM article draft artifact `79d70969-3cb8-46fe-9bc8-e8a0b7878322` from the physical OptiPlex contour `jgdus@100.98.97.98` and used it as the editorial starting point.
- Manually edited and fact-checked the draft into a bilingual Ratgeber release: `ki-browser-2026-atlas-comet-webmcp-und-browserbase`.
- Softened unsupported NotebookLM claims around SOP bypass, password-field extraction, fixed percentage gains, and vendor-specific exploit certainty; kept the article grounded in official OpenAI, Perplexity, Chrome/WebMCP, Browserbase/Stagehand, Trail of Bits, UW, and CSA sources.
- Generated two business-oriented imagegen illustrations and saved only compressed WebP assets under `content/images/ratgeber/`.

## 2026-06-11 - Corrective body-level tool-card editorial pass

- Corrected the selection logic after the second hype refresh: formal `editorial_reviewed` metadata is no longer sufficient to prove a card has real manual prose, because older completion passes left some bodies thin or template-like.
- Rewrote 20 weak DE/EN tool cards selected by rendered-body evidence, not by the registry alone: `10to8`, `acapela-group`, `microsoft-azure-api-management`, `activecampaign`, `acuity-scheduling`, `adp-workforce-now`, `agorapulse`, `ahrefs-content-explorer`, `alitu`, `animoto`, `crisp`, `crowdstrike-falcon`, `deepl-api`, `dell-boomi`, `flyr`, `google-chat`, `microsoft-defender-for-endpoint`, `quasar-framework`, `workato`, and `zeplin`.
- Each selected card now has full human DE/EN sections for audience fit, typical use cases, daily workflow judgement, workflow fit, privacy/data notes, costs, internal alternatives, editorial assessment, and FAQ.
- Registered the corrective batch as `2026-06-11-unedited-tool-card-human-pass-1`; future "unedited" selections should use body-level checks and explicitly skip recency-refresh/hype-polish batches.

## 2026-06-11 - Second hype tool-card polish wave

- Selected the next 20 strategically hot cards after the browser-agent/framework wave: Lovable, Bolt.new, Manus, Devin, OpenHands, v0, CrewAI, OpenAI Codex, Google AI Studio, Gumloop, Sora, Kling AI, Suno AI, Adobe Firefly, Replicate, DeepSeek, Grok, Mistral, Jan, and LM Studio.
- Added fresh DE/EN "June 2026 editorial update" sections focused on vibe-coding, app builders, coding agents, agent orchestration, generative media, model platforms, and local AI workflows.
- Updated localized review metadata, refreshed `site/src/data/content-lastmod.json`, and registered the batch as `2026-06-11-hype-tools-human-polish-2`.

## 2026-06-11 - Hype tool-card human polish

- Selected the 20 active illustrated-but-not-text-registry hype tool cards left after the 2026-05-31 rising AI tools batch: BrowserOS, Browserbase, Mem0, Base44, ChatGPT Atlas, Cline, Composio, Google Antigravity, Kilo Code, Krea AI, LangGraph, Mastra, Napkin AI, OpenCode, Perplexity Comet, Pydantic AI, Qodo, Skyvern, Stagehand, and YouWare.
- Added a fresh DE/EN "June 2026 editorial update" section to each card with practical positioning, rollout criteria, governance risks, and workflow-specific judgement instead of generic generated copy.
- Refreshed review metadata on the 40 localized tool files and registered the batch in `docs/04_operations/tool_card_editorial_registry.json` as `2026-06-11-hype-tools-human-polish`.

## 2026-06-10 - Inventory list repair, alternatives links and Sheet cleanup

- Repaired the desktop `/tools/` inventory register so wide rows no longer clip the right-side category/price columns; local browser QA covered 1365px, 1180px, and 390px with no horizontal overflow.
- Added manual DE/EN internal alternatives to 17 tool cards across scheduling, workflow/queue, OCR/document AI, speech, screen capture, and code-search clusters.
- Marked the same 17 Google Sheet source rows with `alternatives_added=2026-06-10:manual_internal_links` so the source of truth records the manual linking pass.
- Cleaned 12 unpublished Sheet candidates from `NEW`/`NEEDS_REVIEW` into `NEEDS_REVIEW`, `DUPLICATE`, or `BLACKLIST` for wrong URLs, comparison phrases, duplicate products, concepts, or broad social-network noise.
- Verified the paused publishing pipeline state: autopublish, Sheet generation, alternatives seed, and NEEDS_REVIEW rebuild are intentionally paused since 2026-05-18; audits and Umami popularity sync remain active.
- Re-ran the `NEW` dry-run quality gate after cleanup; all 77 remaining `NEW` candidates passed without duplicate or false-tool moves.

## 2026-06-09 - Agentic commerce Ratgeber publication

- Retrieved NotebookLM article draft artifact `e7b82b8b-7e08-45bc-9718-0d1bcee615c8` from the physical OptiPlex contour after Tailscale SSH re-authorization and used it as the editorial starting point.
- Manually edited and fact-checked the draft into a bilingual Ratgeber release: `agentic-commerce-2026-chatgpt-stripe-shopware-und-universal-cart`.
- Removed or softened unsupported NotebookLM draft claims around unverified model/version names, regional rollout specifics, and overly broad autonomous-checkout assertions.
- Kept the factual framing tied to OpenAI/Stripe ACP, UCP, Google AP2, and Shopware Agentic Commerce/Agentic Product Feed/PayPal StoreSync/Copilot Data Assist sources.
- Generated two business-oriented, non-fairytale imagegen illustrations and saved only compressed WebP assets under `content/images/ratgeber/`.

## 2026-06-09 - Persistent AI memory Ratgeber publication

- Manually edited and fact-checked NotebookLM article draft artifact `6636ea6e-cae3-4064-8258-19e947415999` into a bilingual Ratgeber release: `persistente-ki-memory-2026-kontext-zwischen-sessions-projekten-und-modellen`.
- Published the German and English articles with internal links to ChatGPT, Claude, Gemini, NotebookLM, Mem0, LangGraph, Hermes Agent, OpenClaw, and the open-source AI agents comparison guide.
- Removed unsupported NotebookLM draft numbers/claims and kept the factual framing tied to official OpenAI, Anthropic, Google, LangGraph, Mem0, Letta, Zep, Microsoft Research, and arXiv sources.
- Generated two final story-forward imagegen illustrations and saved only compressed WebP assets under `content/images/ratgeber/`.
- Validation covered `npm run check:editorial`, `npm run check:tools:en`, full `npm --prefix site run build`, dist page checks, and sitemap membership for both DE/EN article URLs.

## 2026-06-09 - NotebookLM topic seeds on OptiPlex

- Created six fresh Ratgeber research notebooks in NotebookLM on the physical OptiPlex contour `jgdus@100.98.97.98`, using `/home/jgdus/projects/agent-newsman` and `NOTEBOOKLM_HOME=/home/jgdus/.notebooklm`, not the `opcl` contour.
- Seeded the requested topics: AI browsers/WebMCP, coding agents as work agents, agentic commerce with Shopware, local/on-device AI agents, AI video after Sora, and persistent AI memory across sessions/projects/models.
- All source packs and web/PDF sources were added successfully; all six German NotebookLM briefing reports completed. Run artifacts live under `/home/jgdus/projects/agent-newsman/artifacts/notebooklm_topic_seeds_20260609/`.
- Added a second NotebookLM pass for the same six notebooks that generated completed full German `Artikelentwurf:` report artifacts. These are article drafts for the later manual stage, not reviewed/published Ratgeber pages yet.

## 2026-06-08 - Inventory mobile list repair

- Repaired the decision-layout `/tools/` mobile inventory view so it no longer compresses the desktop register into a narrow left strip after `Mehr anzeigen`.
- Mobile inventory rows now render as full-width app-style cards, with the letter jumpbar as a horizontal chip strip and price/verdict metadata kept horizontal instead of vertical/clipped.
- Local QA covered German and English `/tools/` at 390px and 430px, including the load-more interaction and scroll-width checks.

## 2026-06-08 - Pocket Decision Desk mobile layer

- Added a dedicated mobile app-style CSS layer for the decision/KI-Blatt design under the `Pocket Decision Desk` concept.
- The mobile layer keeps desktop newspaper composition unchanged, but turns phone views into card-based sections with touch-sized sticky navigation, safer heading scales, and one primary vertical scroll.
- Hardened mobile overflow for homepage, tool index, tool/article detail pages, and markdown tables; wide nav/tag/table areas now scroll inside their own containers instead of widening the page.
- Local QA covered `/`, `/en/`, `/tools/`, and the latest Ratgeber article at 390px and 430px viewports, plus a desktop 1280px smoke check.

## 2026-06-08 - Dynamic homepage decision test block

- Replaced the homepage decision test table's hardcoded first-article fallback with article-driven data from `decisionTools`, `decisionAvoid`, and `decisionNote`.
- Added current DE/EN open-source agents comparison frontmatter for the homepage `Im Test` / `In the test` block so it now follows the latest Ratgeber topic.

## 2026-06-08 - Hero headline scale correction

- Reduced oversized decision-layout hero headline scales on the homepage and Ratgeber article pages while keeping the editorial newspaper typography.
- Added final responsive CSS overrides so desktop and mobile headings stay readable without taking over the entire first viewport.

## 2026-06-07 - Dynamic decision issue number

- Replaced the hardcoded decision issue number `049` with a build-time value derived from the number of published German Ratgeber articles.
- The shared decision layout, homepage issue masthead, recent guide cards, and DE/EN archive headers now move together as new Ratgeber articles are published.

## 2026-06-07 - Homepage latest-guide movement

- Fixed the decision-layout homepage so the visible hero now uses the newest Ratgeber entries instead of only the pinned editorial guide list.
- The homepage still keeps pinned/curated guide cards, but the primary announcement now moves when a fresh article is published.
- Verified the built German and English homepages surface the new open-source AI agents comparison as `Neu im Ratgeber` / `New guide`.

## 2026-06-07 - Dynamic live date in site header

- Fixed the decision-layout header date so it is no longer hardcoded to `27.05.2026`.
- Added `site/src/lib/contentFreshness.ts`, which derives the public `live` date from the newest value in `site/src/data/content-lastmod.json`.
- Updated the shared layout and the decision-style homepage masthead to use the same freshness labels, so the header now moves with the latest published content after builds.
- Local production build verified the generated HTML shows `live · 07.06.2026` and the localized long date on German and English pages.

## 2026-06-07 - Open-source AI agents comparison Ratgeber

- Manually edited and published a new bilingual Ratgeber comparison: `open-source-ai-agents-im-vergleich-hermes-agent-openclaw-openhands-autogen-crewai-langgraph-und-cline`.
- The article compares Hermes Agent, OpenClaw, Cline, OpenHands, AutoGen, CrewAI, and LangGraph by workflow role rather than by generic ranking.
- Generated two story-forward imagegen WebP illustrations for the release and saved only final compressed WebP assets under `content/images/ratgeber/`.
- The release was prepared from a clean worktree based on fresh `origin/master` and merged the latest `origin/autobot` popularity sync before content changes, so the manual Ratgeber publish does not discard autopopularity updates.
- NotebookLM source work for this article happened on the physical OptiPlex contour `jgdus@100.98.97.98` with `NOTEBOOKLM_HOME=/home/jgdus/.notebooklm` and must remain tied to the paid Google account `vasjakotov11@gmail.com`.

## 2026-05-31 - Rising AI tools batch

- Added 20 rising AI tool cards from the Sheet seed into DE/EN content: Cline, Kilo Code, OpenCode, Qodo, Google Antigravity, ChatGPT Atlas, Perplexity Comet, Browserbase, Stagehand, Skyvern, BrowserOS, LangGraph, Pydantic AI, Mastra, Mem0, Composio, Base44, YouWare, Napkin AI, and Krea AI.
- Replaced rejected SVG-like placeholders with 20 story-forward ChatGPT/imagegen WebP illustrations in `content/images/tools/*-editorial.webp`.
- Expanded the new cards with full manual editorial structure and registered the image batch in `docs/04_operations/tool_card_illustration_registry.json`.
- Validation passed: editorial template guard, tool quality guard, English translation guard, newest-sort check, full Astro build, and dist image/page verification.
## 2026-05-27 - Tool illustration duplicate backfill

- Audited the latest story illustration batches and found four duplicate registry entries from earlier illustrated cards: `theia`, `trello-mit-butler`, `uipath`, and `veryfi`.
- Removed those duplicate registry entries and added four unique 1260x800 WebP story illustrations for the next edited-tail cards: `vyrill`, `waifu2x`, `wave`, and `wave-video`.
- Inserted localized image-only `tool-editorial-figure` blocks in German and English and recorded the backfill in `docs/04_operations/tool_card_illustration_registry.json`.

## 2026-05-21 - Popular tool-card recency refresh

- Refreshed 40 high-recognition DE/EN tool cards with a focused 2026 feature/workflow update block rather than rewriting the full already-edited articles.
- Updated `updated_at` frontmatter and `site/src/data/content-lastmod.json` for the 80 affected localized pages so sitemap freshness can move with the editorial change.
- Registered the batch as `2026-05-21-recency-refresh-popular-40` in `docs/04_operations/tool_card_editorial_registry.json` for future skip/audit logic.
- Selection: `chatgpt`, `claude`, `gemini`, `perplexity`, `microsoft-copilot`, `github-copilot`, `midjourney`, `canva`, `figma`, `notion-ai`, `zapier`, `make-ehemals-integromat`, `n8n`, `cursor`, `replit`, `runway`, `synthesia`, `capcut`, `descript`, `elevenlabs`, `grammarly`, `deepl`, `google-translate`, `microsoft-translator`, `hubspot-crm`, `hubspot-sales-hub`, `salesforce-sales-cloud`, `miro`, `airtable`, `asana`, `monday-com`, `clickup`, `microsoft-teams`, `zoom`, `tableau`, `power-bi`, `aws-sagemaker`, `openai-api`, `hugging-face`, `langchain`.

## 2026-05-15 - Tool illustration batch 25

- Added one landscape 1260x800 WebP editorial illustration to 30 additional manually edited tool cards in both German and English.
- Selection continues the active registry-backed, non-illustrated sequence from `nvivo` through `poeditor`.
- Expanded the visual direction after feedback about repeated dashboards and desks: theater stages, observatories, greenhouses, mountain lodges, canal locks, code looms, underwater labs, film backlots, gardens, rail yards, concert halls, and harbor logistics.
- Regenerated three variants with visible alphanumeric artifacts before inserting localized image-only `tool-editorial-figure` blocks and updating the illustration registry.

## 2026-05-15 - Tool illustration batch 24

- Added one landscape 1260x800 WebP editorial illustration to 50 additional manually edited tool cards in both German and English.
- Selection continues the active registry-backed, non-illustrated sequence from `metabase` through `nvidia-dgx-systeme`; the interrupted run had 43 generated PNGs and was resumed for the final seven.
- Inserted localized image-only `tool-editorial-figure` blocks, updated the illustration registry, and kept the generated PNG originals in the Codex image cache while only WebP assets are referenced by the site.



## 2026-05-15 - Umami upgraded to v3.1.0

- Upgraded `https://stats.utildesk.de` on server `utildesk` (`46.224.94.65`) from the old `ghcr.io/umami-software/umami:postgresql-latest` container to pinned `docker.umami.is/umami-software/umami:3.1.0`.
- Deployment location: `/opt/umami`; stack uses Docker Compose, Traefik, app container `umami`, and PostgreSQL container `umami-db`.
- Pre-upgrade backup: `/opt/umami/backups/pre-v3.1.0-20260515T154952Z/umami-postgres.dump`; SHA256 `7f3c254475d23f0b5f754793a5e61debd4a57d7ce07df232fd6f7097ecfb972e`.
- Automatic migrations applied successfully: `15_add_share`, `16_boards`, `17_remove_duplicate_key`, `18_add_performance`, `19_add_session_replay`.
- Verification passed: `https://stats.utildesk.de/` HTTP 200, `/api/heartbeat` returns ok, `/script.js` HTTP 200 with new 4595-byte tracker, real-browser smoke hit `tools.utildesk.de` and `/api/send` returned 200; PostgreSQL `website_event` received a fresh event at `2026-05-15 15:55:33 UTC`.
- Privacy note: v3.1.0 includes Session Replay, but it was not enabled during the upgrade. Keep replay disabled unless there is a separate GDPR/privacy decision.

## 2026-05-15 - Tool illustration batch 23

- Added one landscape 1260x800 WebP editorial illustration to 50 additional manually edited tool cards in both German and English.
- Selection covers active non-illustrated registry-backed cards from 8x8 through Meta AI, including the newly edited earlier alphabetical gaps.
- Published only wide landscape generations; square draft variants were not inserted. The batch keeps the varied story direction with paper dioramas, photo still lifes, collage, hardware/security scenes, learning workshops, audio/video production tables, and marketing workflow objects.
- Updated the tool-card illustration registry so future batches skip these slugs.

## 2026-05-15 - Final active tool-card text editorial pass

- Manually expanded the remaining 30 active DE/EN tool cards missing from the text editorial registry, from `8x8` through `vivaldi`.
- Added practical use cases, daily-use judgement, workflow-fit guidance, data/privacy notes, and editorial assessments in both German and English.
- Updated `docs/04_operations/tool_card_editorial_registry.json` so the active paired tool-card manual text audit is closed again.

## 2026-05-14 - Tool illustration batch 19

- Added one mid-article WebP illustration to 50 additional manually edited tool cards in both German and English.
- Selection covers the current next registry-backed, non-illustrated cards alphabetically, from `acapela-group` through `audiotool`.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Broadened the visual direction after feedback about dashboard repetition: photo still lifes, paper dioramas, mixed-media collage, physical data metaphors, hardware macro scenes, audio workbenches, learning stages, and workflow objects.
- Converted generated PNG sources directly to WebP without copying PNG files into the project workspace.

## 2026-05-14 - Final tool-card text editorial gap pass
- Manually improved or normalized the remaining 40 DE/EN tool cards that were missing from the text editorial registry, including disabled legacy aliases.
- Added practical workflow-fit and editorial-assessment language where pages still had generic generated structure, and registered already hand-edited OCR/document cards.
- Updated `docs/04_operations/tool_card_editorial_registry.json` so the manual text-edit audit has 0 unregistered paired tool cards.
- Post-rebase addendum: after the concurrent sheet publish commit added 10 more paired tool cards, manually edited and registered those cards too before production deploy.
- Follow-up polish: revisited the 10 freshly published Sheet tool cards (`tara-ai`, `adobe-captivate`, `azure-stream-analytics`, `teradata-vantage`, `azure-devops`, `microsoft-azure-event-hubs`, `microsoft-azure-hdinsight`, `kaggle-learn`, `medibang-paint`, `h2o-automl`) and rewrote their DE/EN introductions, daily-use, workflow-fit, and editorial-assessment sections to remove the remaining generic template phrasing.

## 2026-05-14 - Publish QC gate unblocked for large NEW queues

- Investigated why Google Sheet `NEW` rows were no longer reaching production: VPS publish cron was healthy and unpaused, but `qc_before_publish.mjs` timed out before generation.
- Root cause: the Sheet had 207 `NEW` rows, while the QC helper tried to resolve every `NEW`/`IN_PROGRESS` official URL before each 10-row publish batch; the helper timed out with `spawnSync node ETIMEDOUT`, causing the fail-closed marker `QC_MOVED_TO_NEEDS_REVIEW=9999`.
- Fixed the gate so publish QC checks all `IN_PROGRESS` rows plus a bounded leading slice of `NEW` rows tied to `PUBLISH_BATCH_SIZE` before each run, instead of verifying the entire backlog every time.
- Also fixed `resolveFinalUrl()` to honor the older `timeoutMs` option used by existing QC/audit callers, avoiding accidental fallback to the longer default request timeout.
- Follow-up hardening: live URL reachability failures from the VPS are now advisory in the pre-publish gate instead of a hard `NEEDS_REVIEW` reason; definite static policy failures, self-references, suspicious resolved redirects, and duplicate rows still block.
- Follow-up translation hardening: the English tool translator now supports `TRANSLATE_BACKEND=auto|codex|openai`; `auto` keeps Codex OAuth as the first choice but falls back to the OpenAI API when `OPENAI_API_KEY` is available, and the cron preflight accepts either backend before touching new Sheet rows.

## 2026-05-13 - Tool illustration batch 18

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `rev-com`; slugs run from `reverso` through `scrivener`.
- Shifted the visual direction toward story-forward scenes after feedback about dashboard repetition: photo still lifes, mixed-media collage, paper dioramas, miniature labs, film sets, and physical workflow props.
- Accepted normal props such as phones, keypads, envelopes, calendars, stamps, and office pictograms when they supported a scene; replaced variants that still felt readable-text, logo, face/avatar-heavy, or dashboard-like.
- Generated PNG originals are removed from the local cache after WebP conversion so the image folder stays clean after publication-style batches.

## 2026-05-13 - E2a Ratgeber published and Chagall-inspired visual refresh

- Published the approved E2a Ratgeber as a full DE/EN package: `content/ratgeber/e2a-open-source-email-gateway-for-ai-agents-so-gelingt-der-einsatz-in-der-praxis.md` and the English sibling under `/en/`.
- Initial content release commit: `6141cfbf` (`content: publish e2a email gateway guide`); final visual refresh commit: `84f6ae24` (`content: refresh e2a guide illustrations`).
- Replaced the first cinematic/technical-looking visuals after user feedback with two cache-busting, Chagall-inspired poetic story WebP files: `*-cover-chagall.webp` (1536x864, 200798 bytes) and `*-workflow-chagall.webp` (1536x864, 172430 bytes).
- Live verification passed for the German and English URLs plus both WebP assets; live HTML references the `-chagall.webp` files and no longer references the old `*-cover.webp` / `*-workflow.webp` artwork.
- Cloudflare Ratgeber candidate `20260511-e2a-open-source-email-gateway-for-ai-agents-how_to-bb2d056d` was marked `published` via the upload API with the final WebP assets; publish and rework queues reported 0 pending requests.
- Validation before publication passed: editorial template check, English tool translation check, and Astro build (`2844` pages).

## 2026-05-13 - Tool illustration batch 17

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `quark`; slugs run from `quasar-framework` through `rev-com`.
- Regenerated the batch with deliberately varied styles after uniformity feedback: paper collage, parchment map, blueprint, light isometric, studio still life, darkroom, acoustic sculpture, and pastel logistics diagrams.
- Rejected replacement variants with platform-logo, face/head, user/profile-icon, readable-text, or repeated-dashboard artifacts before converting the selected outputs.

## 2026-05-13 - Tool illustration batch 16

- Added one mid-article WebP illustration to 50 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `nintex`; slugs run from `nintex-rpa` through `quark`.
- Generated replacement variants for readable-text, formula, and letter-icon artifacts, then converted only the selected outputs into workspace WebP assets.
- Cleaned generated PNG cache after conversion so the local image folder stays empty after publication-style batches.

## 2026-05-13 - Tool editorial completion from production-sync

- Ported the clean generated-text editorial pass onto current production head `0f7f556` instead of the stale dirty main checkout.
- Publish scope is 390 additional DE/EN tool cards; `ableton-live` stayed untouched because current production already had 2026-05-11 manual editorial/illustration registry coverage.
- Updated `docs/04_operations/tool_card_editorial_registry.json` with the three 2026-05-13 editorial batches and tightened `scripts/list_tool_editorial_candidates.mjs` so future selection skips the illustration registry.
- Validation before release passed: editorial checks, EN tool checks, marker/registry overlap audit, `git diff --check`, and Astro build.

## 2026-05-12 - Tool illustration batch 15

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `manus`; slugs run from `mate-translate` through `nintex`.
- Generated replacement variants for figurative, readable-text, platform-logo, and profile/icon artifacts; only selected WebP outputs were copied into the workspace.

## 2026-05-12 - Tool illustration batch 14

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `landr`; slugs run from `languagetool` through `manus`.
- Generated replacement variants for figurative, interface-like, text, and iconographic artifacts; only selected WebP outputs were copied into the workspace.

## 2026-05-12 - Tool illustration batch 13

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `inshot`; slugs run from `insomnia` through `landr`.
- Generated replacement variants for text, logo-like, platform-logo, and distracting pictogram artifacts; only selected WebP outputs were copied into the workspace.

## 2026-05-12 - Tool illustration batch 12

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `grok`; slugs run from `groove` through `inshot`.
- Generated two replacement variants for visible text/flag artifacts; only selected WebP outputs were copied into the workspace and PNG originals remain in the Codex image cache.

## 2026-05-12 - Tool illustration batch 11

- Added one mid-article WebP illustration to 50 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme from the latest batches.
- Selection follows the edited-tail illustration registry after `faceapp`; slugs run from `facetune` through `grok`.
- Generated extra replacement variants for scenes with anatomy, text, brand-like, or screenshot artifacts; only the selected WebP outputs were copied into the workspace.
- Generated PNG originals remain in the Codex image cache per the current save-path policy.

## 2026-05-11 - Tool illustration batch 10

- Added one mid-article WebP illustration to 50 additional manually edited tool cards in both German and English.
- Continued the smaller illustration scheme: 1260px source WebP assets and the existing 90% `.tool-editorial-figure` display width.
- Selection follows the edited-tail illustration registry after `cloudera-data-platform`; slugs run from `codecademy` through `faceapp`.
- Expanded the newer story prompts within the batch to vary settings and visual metaphors more strongly, following user feedback during generation.
- Generated PNG originals for this batch were removed after WebP conversion so the local image cache does not keep unnecessary source files.

## 2026-05-11 - Tool illustration batch 9

- Added one mid-article WebP illustration to 20 additional manually edited tool cards in both German and English.
- Reduced editorial illustration display width to 90% in `site/public/styles/global.css`; this also makes earlier editorial figures visually smaller.
- New assets use 1260px source width instead of the earlier 1400px batches.
- Slugs: `bubble`, `buffer`, `buzzsprout`, `buzzsumo`, `c3-ai`, `callrail`, `canva-video`, `captum`, `capture-one`, `celtx`, `cerebras-wafer-scale-engine`, `character-ai`, `chatbot-com`, `chatterbot`, `chorus-ai`, `civitai`, `clarivate-analytics`, `clickhouse`, `clipchamp`, `cloudera-data-platform`.
- Generated PNG originals for this batch were removed after WebP conversion so the local image cache does not keep unnecessary source files.

## 2026-05-11 - Bidirectional Ubuntu/Windows deploy sync

- Added `scripts/sync_after_remote_deploy.sh` so the Ubuntu worker can fast-forward safely after a Windows-side deploy, or update a clean production-memory mirror when the worker checkout is dirty.
- Extended `scripts/deploy_from_ubuntu.sh` so successful direct Ubuntu deploys can call the Windows laptop sync helper via `UTILDESK_WINDOWS_SYNC_SSH`, keeping `C:\projects\utildesk-motia-production-sync` current.
- Extended `scripts/sync_after_remote_deploy.ps1` with Ubuntu callback sync by default; pass `-NoUbuntuSync` or set `UTILDESK_SYNC_UBUNTU_AFTER_WINDOWS=0` to opt out.
- Added background auto-sync installers/runners: Windows Scheduled Task helper and Ubuntu cron helper, both defaulting to a 15-minute cadence and log files outside content.
- Windows auto-sync is installed via a hidden `wscript.exe` runner that launches PowerShell with `-WindowStyle Hidden`, so scheduled background sync should not pop up PowerShell or cmd windows.
- Updated the Ubuntu deploy/sync runbook with the active Ubuntu/Windows paths and the rule that GitHub credentials stay outside the repo.

## 2026-05-11 - Ubuntu deploy and laptop sync helpers

- Added a guarded Ubuntu production deploy helper: `scripts/deploy_from_ubuntu.sh`.
- Added a Windows laptop sync helper: `scripts/sync_after_remote_deploy.ps1`.
- Added a Windows hub fallback publisher: `scripts/publish_hub_ref_from_windows.ps1`.
- Added runbook `docs/04_operations/ubuntu_deploy_sync.md` and linked it from `scripts/README.md`.
- The new flow requires clean committed work, production-relevant memory/handoff updates, `origin/master`/`origin/autobot` alignment, and a safe laptop production-memory mirror when the main checkout is dirty.

## 2026-05-11 - Tool illustration batch 8

- Added one mid-article WebP illustration to 10 additional manually edited tool cards in both German and English.
- Selection follows the previous edited-tail runs: next registry-backed alphabetical candidates not already listed in `docs/04_operations/tool_card_illustration_registry.json`.
- Slugs: `beautiful-ai`, `beautyplus`, `befunky`, `bert`, `betty-blocks`, `bigbluebutton`, `binder`, `bookafy`, `box`, `branchtrack`.
- Recorded the batch in `docs/04_operations/tool_card_illustration_registry.json` so future illustration passes skip these tools.

## 2026-05-11 - Ableton Live manual editorial rewrite

- Rewrote the previously unregistered production-generated Ableton Live tool card in German and English.
- Added the slug to `docs/04_operations/tool_card_editorial_registry.json` so future manual editorial passes skip it.

## 2026-05-11 - Ableton Live tool illustration

- Added one mid-article WebP illustration to the Ableton Live tool card in both German and English.
- Registered the image in `docs/04_operations/tool_card_illustration_registry.json`.

## 2026-05-11 - Clip Studio Paint tool illustration

- Added one mid-article WebP illustration to the Clip Studio Paint tool card in both German and English.
- Followed the previous PNG-to-WebP scheme: generated raster artwork, converted to 1400px-wide WebP, inserted an image-only `tool-editorial-figure`, and recorded the slug in `docs/04_operations/tool_card_illustration_registry.json`.

## 2026-05-10 - Tool illustration batch 6

- Added one mid-article WebP illustration to 10 additional manually edited tool cards in both German and English.
- Selection follows the previous edited-tail batch: next registry-backed alphabetical candidates not already listed in `docs/04_operations/tool_card_illustration_registry.json`.
- Slugs: `avigilon`, `avoma`, `aweber`, `aws-cloud9`, `aws-kinesis`, `axis-communications`, `azure-machine-learning`, `b612`, `babbel`, `balsamiq`.
- Recorded the batch in `docs/04_operations/tool_card_illustration_registry.json` so future illustration passes skip these tools.

## 2026-05-09 - Tool Card Editorial Illustrations Batch 2

### Done
- Added one mid-article ChatGPT-generated WebP illustration to 30 additional tool cards, covering homepage pinned tools first and then high-popularity non-illustrated tools.
- Kept the existing image-only figure pattern: no visible captions, German and English alt text, shared WebP asset per tool.
- Updated `docs/04_operations/tool_card_illustration_registry.json` so future batches skip these slugs.

### Slugs
`wispr-flow`, `chatgpt`, `claude`, `midjourney`, `perplexity`, `zapier`, `endnote`, `bolt-new`, `canva`, `figma`, `jovian`, `marian-nmt`, `rytr`, `adept`, `adobe-firefly`, `adobe-photoshop-express`, `alteryx`, `amazon-dynamodb`, `amazon-transcribe`, `capcut`, `clara`, `consensus`, `coreldraw`, `cypress`, `dall-e`, `descript-overdub`, `fountain`, `gemini`, `ginger`, `google-tabellen`.

## 2026-05-09 - German Visible Umlaut Normalization

### Done
- Normalized visible German ASCII transliteration leftovers across the tool and Ratgeber content corpus, especially `fuer`, `ueber`, `Qualitaet`, `Pruefung`, `Moeglichkeit`, `tatsaechlich`, `Einstiegshuerde`, and compound forms like `Produktivitaetswerkzeug`.
- Follow-up tail audit fixed rarer forms such as `atmosphaerisch`, `anschlussfaehig`, `Loeschfristen`, `Trainingslaeufe`, `Privatsphaere`, `Woerterbuch`, and `moegen`; remaining suspicious scan hits are the proper name `BigBlueButton`.
- Scope was limited to German `content/tools` and `content/ratgeber` Markdown; URL, slug, source, image, and inline-code segments were intentionally skipped.
- The first attempted inline PowerShell Unicode write was discarded before build; the applied pass used ASCII-only placeholder decoding to avoid `?` mojibake.

### Verification
- Targeted German transliteration grep returned no hits for the configured visible bad-pattern set.
- `npm run check:editorial`, `node scripts/check_english_tool_translations.mjs`, `git diff --check`, and full `npm --prefix site run build` passed.

## 2026-05-09 - Tool Card Editorial Illustrations Batch 1

### Done
- Added one mid-article ChatGPT-generated WebP illustration to 20 already edited tool cards, with German and English alt text. The later cleanup removed visible captions because they added visual noise under the artwork.
- Used the second, corrected generation run only; the first stopped run was intentionally discarded because the visuals looked too uniform.
- Added `docs/04_operations/tool_card_illustration_registry.json` as the project memory for illustrated tool cards so future batches do not repeat these slugs.
- Removed the temporary local FotoJet illustration preview directory from `site/public/editorial-preview` so it cannot leak into production.

### Slugs
`adobe-enhance-speech`, `davinci-resolve`, `descript-studio-sound`, `elicit`, `fotojet`, `genei`, `litmaps`, `paperpile`, `pons`, `power-bi`, `research-rabbit`, `snappa`, `workday-hcm`, `continue`, `storystream`, `deepinfra`, `youcanbook-me`, `obs-studio`, `ourdream-ai`, `mailbird`.

## 2026-05-07 - Ratgeber Final Artwork Gate

### Done
- Hardened `scripts/ratgeber_cloudflare_candidate_sync.py` so the local HTML/PNG fallback renderer is no longer accepted as final `review_ready` artwork.
- Candidate uploads now reject unapproved/untagged PNG pairs, identical cover/workflow hashes, and visual metadata containing generic diagram/debug/service-label signals.
- Rework upload no longer passes `--force-images`, so a rework cannot accidentally overwrite manually prepared ChatGPT/editorial art with fallback schematics.
- Manual candidate uploads via `scripts/upload_ratgeber_candidate_from_md.mjs` now attach approved visual metadata by default.

## 2026-05-07 - Ratgeber Source And Tool-Link Guardrails

### Done
- Added a hard Ratgeber source rule: no Russian/Chinese/CJK source text, no RU/CN locale URLs, and no Russian corporate PR/local-market "know-how" as article source material.
- Removed Habr from the topic-harvester source mix and added explicit filters for Habr, Sber/Sberbank/SberTech, Platform V, Yandex, VK, Mail.ru, Rambler, Rutube, Skolkovo, Tinkoff/T-Bank, MTS, and Kaspersky.
- Added the catalog contract for Ratgeber text: recognized tool names must link to internal Utildesk cards when a card exists.
- Added the missing-card contract: if a Ratgeber draft mentions a relevant tool without a card, queue that tool for review instead of inventing an external text link.
- Clarified the admin-review contract: candidates do not self-improve in place; only an explicit rework request enters the KV queue, and the old preview should stay hidden until the rework consumer has produced real text or visual changes.
- Replaced the current Browser-Agenten candidate's lower workflow illustration with a distinct ChatGPT-generated PNG scene and force-uploaded the refreshed candidate preview to Cloudflare at `2026-05-07T08:16:15Z`.

### Verification
- Local Python compile passed for `scripts/ratgeber_topic_harvester.py`, `scripts/ratgeber_cloudflare_candidate_sync.py`, and the patched `opcl` export script draft.
- `opcl` rework cron is installed every 10 minutes and currently reports no pending rework requests; the refreshed candidate upload returned `ok: true` with both `cover.png` and `workflow.png` assets.

## 2026-05-06 - Search Sitemap Split

### Done
- Split search sitemaps into a conservative Google contract and a broad Bing contract.
- `sitemap.xml` remains the only sitemap advertised in `robots.txt` and submitted to GSC.
- `sitemap-bing.xml` is generated for Bing and should be submitted explicitly only when Bing needs a refresh.
- Long-tail tool pages now stay globally `index,follow` but can carry `googlebot noindex,follow`, so Google staging no longer suppresses Bing.

### Verification
- Live `https://tools.utildesk.de/sitemap.xml`: `322` unique URLs, no long-tail sample `10to8`, includes indexable partner/core sample `wispr-flow`.
- Live `https://tools.utildesk.de/sitemap-bing.xml`: `2092` unique URLs, includes both `10to8` and `wispr-flow`.
- GSC accepted and downloaded `sitemap.xml` with `submitted = 322`, `warnings = 0`, `errors = 0`.
- Bing feed was intentionally not resubmitted during this Google-focused repair.

### Commit
- `078b3c3` (`fix(seo): split google and bing sitemap policy`)

## 2026-05-06 - Ratgeber Candidate Gate Repair

### Done
- Removed two invalid Cloudflare review candidates:
  - `20260506-agentic-api-grader-by-saastr-ai-tool_spotlight-658e792b`
  - `20260505-vyrill-agentic-video-commerce-platform-tool_spotlight-e5394bec`
- Copied the hardened `scripts/ratgeber_cloudflare_candidate_sync.py` to the live `opcl` article factory.
- Hardened the `opcl` journalist editor so `tool_spotlight`, `tool_review`, `product_spotlight`, and `product_review` do not enter the Ratgeber article queue.
- Made visual quality a hard Cloudflare upload gate: failed, generic, fallback, placeholder, raw, unrelated, cloned, or debug-style visuals are rejected before review upload.

### Verification
- Cloudflare admin review page no longer contains `SaaStr` or `Vyrill` candidates and shows no open candidates.
- `opcl` dry-run sync reports `uploaded = 0` and both bad artifacts now have `cloudflare_review_rejected.json`.
- `opcl` article review queue reports `count = 0` open review packets.

## 2026-05-06 - Ratgeber Topic Harvester

### Done
- Added `scripts/ratgeber_topic_harvester.py` as the production-ready source-driven topic collector.
- Copied it to `opcl:/opt/openclaw/workspace/agent-newsman/scripts/ratgeber_topic_harvester.py`.
- Disabled the old `tool_spotlight` single-release fallback in both `opcl` copies of `intel_agent.py`.
- Wired the harvester into `opcl` daily intel run after the news/source pass.
- Queued two accepted multi-source Ratgeber jobs:
  - `AI-Agenten im Betrieb: Welche Tools Kontrolle, Monitoring und Review wirklich leisten`
  - `Browser-Agenten im Praxistest: Wo Automation hilft und wo sie gefaehrlich wird`

### Verification
- `python3 -m py_compile` passed for the harvester and patched `intel_agent.py` files on `opcl`.
- Harvester dry-run produced only multi-source jobs; no `tool_spotlight` remained in `latest_run.json`.
- `scripts/article_orchestrator.py --limit 2 --dry-run` accepted both jobs with `rejected_count = 0`.

## 2026-05-04 — Tool Editorial Expansion Batch 2

### Done
- Expanded 50 German tool articles with more authorial editorial text, longer practical sections, workflow notes, privacy/data notes, pricing context, alternatives, editorial assessment, and FAQ.
- Synced the same 50 English sibling articles in `content/en/tools/*.md` from the revised German source, then normalized English section headings for consistent page structure.
- Fixed `content/tools/yandex-translate.md` `official_url` from a captured Yandex captcha URL to `https://translate.yandex.com/`.
- Removed stale English body artifacts during overwrite, including the old incorrect HeyGen provider line.

### Commits
- German editorial batch: `35c7c76` (`content: expand 50 more tool articles`)
- English sibling sync: `4858aa9` (`content: sync english versions for 50 tool articles`)

### Slugs
`talend-data-fabric`, `heygen`, `jira`, `resemble-ai`, `streak`, `anchor`, `ibm-watson`, `getresponse`, `inshot`, `replika`, `ionic`, `facetune`, `taguette`, `setmore`, `zamzar-ai`, `busuu`, `kive`, `reverso`, `mural`, `cubase`, `picsart`, `grafana`, `fairseq`, `appium`, `framework7`, `livechat`, `audacity`, `aws-cloud9`, `nintex`, `swiftkey`, `v0`, `t-racks-von-ik-multimedia`, `bibdesk`, `postman`, `plot`, `spyfu`, `apache-storm`, `ren-py`, `viktor-for-media-buyers`, `artrage`, `any-do`, `apache-solr`, `pencil`, `magix-video-pro-x`, `execvision`, `hive`, `yandex-translate`, `remove-bg`, `sonix`, `whitesmoke`.

### Verification
- German selected-content check: 50/50 files, required sections present, minimum 602 words, no repeated long paragraphs, no captcha/mojibake/preismodell artifacts.
- English selected-content check: 50/50 files, required sections present, minimum 683 words, no forbidden German headings or old body artifacts, no repeated long paragraphs.
- `npm run check:editorial` passed.
- `node scripts/check_english_tool_translations.mjs` passed.
- `npm --prefix site run build` passed: 2673 pages built; sitemap regenerated with 434 URLs; Ratgeber manifest still reports 6 pages.

### Safety Notes
- Existing unstaged local changes were intentionally left untouched: `content/tools/chatgpt.md`, `docs/04_operations/backlink_outreach.md`, `docs/04_operations/bing_webmaster_access.md`, `docs/04_operations/search_console_health.md`.
- After this batch, keep checking `origin/master...origin/autobot` and live production after every task so no production or Ratgeber blocker is left behind.

## 2026-03-23 — Design System Merge

### Merged: design/stitch-digital-atelier → master
**Commit:** 19289df

**Changes:**
- `site/public/styles/global.css`: Full design system rewrite
  - Stitch Digital Atelier (Google Stitch design tool)
  - Teal primary (#176259), warm surface (#fafaf1)
  - Plus Jakarta Sans + Inter fonts via Google Fonts
  - Glassmorphism sticky header (backdrop-blur 24px)
  - Ambient shadows, ghost borders (rgba 35%)
  - Home cards: horizontal layout (logo left, title right)
  - Tool cards: 4-line descriptions, badges pinned to bottom
  - Hero: italic + skewX(-8deg) accent word
  - Tool detail: Direktlink box with logo centered (flex)
  - Prose: padding 36px 48px, max-width 860px

- `site/src/layouts/BaseLayout.astro`:
  - Sticky glass header (position: fixed, blur 24px)
  - Preconnect to Google Fonts
  - Updated footer with rounded top corners

- `site/src/pages/index.astro`:
  - New .hero-stitch section with skewed italic accent
  - Removed old inline <style> override block

- `site/src/pages/tools/[slug].astro`:
  - Logo integrated into Direktlink box (flex, vertically centered)
  - linkAllMentions: all occurrences of tool name → link
  - badge-category: now <a> link to /category/slug/ (canonical)
  - badge tags: already linked to /tools/?tag= (unchanged)
  - Improved article typography in <style> block

**Backup:** tag `backup/master-pre-design-20260323-0559`

---

## 2026-03-21 — Last Autogen
- 639 tools published to production
- 743 tools in content/ directory
- Cron pipeline healthy, 0 errors
## 2026-05-10 - Tool illustration batch 3

- Added one mid-article WebP illustration to the next 30 highest-popularity non-illustrated tool cards, in both German and English.
- Slugs: `google-translate`, `grafana`, `grammarly`, `groq`, `hubspot-sales-hub`, `hypic`, `intel-habana-labs`, `interpretml`, `kofax-rpa`, `langai`, `lingvanex`, `looker-studio`, `mallet`, `marvel`, `meaningcloud`, `microsoft-translator`, `mongodb`, `n8n`, `narrato`, `notebooklm`, `papago`, `pimeyes`, `poe`, `prisma`, `redis`, `replit`, `sap-sales-cloud`, `scribens`, `slick-write`, `sockeye`.
- Recorded the batch in `docs/04_operations/tool_card_illustration_registry.json` so future illustration passes skip these tools.

## 2026-05-10 - Tool illustration batch 4

- Added one mid-article WebP illustration to 30 more tool cards in both German and English.
- Selection: remaining non-illustrated tools with non-zero DE/EN popularity first, then high-intent catalogue tools without prior artwork.
- Slugs: `adobe-illustrator`, `10to8`, `adobe-premiere-pro`, `amazon-codewhisperer`, `copilot`, `openhands`, `speechmatics`, `storymapjs`, `talend-data-fabric`, `talon`, `theia`, `uipath`, `whisper`, `writesonic`, `youcam-makeup`, `affinity-designer`, `inkscape`, `adobe-express`, `miro`, `trello-mit-butler`, `airtable`, `tableau`, `semrush`, `postman`, `spacy`, `tensorflow`, `zotero`, `zoom`, `webflow`, `synthesia`.
- Recorded the batch in `docs/04_operations/tool_card_illustration_registry.json` so future illustration passes skip these tools.


## 2026-05-12 - Video AI tool cards published from Ratgeber mentions

### Done
- Added and manually edited German and English tool cards for `vyrill`, `naoma-ai`, and `hera` after they were mentioned in the multimodal agents Ratgeber article but were missing from the catalogue.
- Added the three tools to the source Sheet rows 1646-1648 and marked them `DONE` after live production verification.
- Linked the existing German and English Ratgeber article mentions to the new tool cards and added the tools to article `relatedTools`.
- Published directly to Cloudflare Pages with Wrangler because GitHub push alone did not make the new pages live within the wait window.

### Commit / deploy
- Content commit: `8bc2854` (`content: add Vyrill Naoma AI and Hera tool cards`).
- Direct Cloudflare Pages deployment URL: `https://190b28d4.utildesk-motia.pages.dev`.
- Live verification passed for:
  - `https://tools.utildesk.de/tools/vyrill/`
  - `https://tools.utildesk.de/en/tools/vyrill/`
  - `https://tools.utildesk.de/tools/naoma-ai/`
  - `https://tools.utildesk.de/en/tools/naoma-ai/`
  - `https://tools.utildesk.de/tools/hera/`
  - `https://tools.utildesk.de/en/tools/hera/`
  - `https://tools.utildesk.de/ratgeber/multimodale-agenten-warum-bild-video-und-code-jetzt-in-einem-workflow-landen-ein/`
- IndexNow submission succeeded for 9 derived URLs; both `api.indexnow.org` and Bing returned `200`.

### Operational note
- Windows `origin/master` and `origin/autobot` reached `8bc2854`; `C:\projects\utildesk-motia-production-sync` and VPS `/opt/utildesk-motia` were reset/synced to the same commit.
- Hub/Ubuntu mirror push to `jgdus@100.98.97.98` was blocked by a Tailscale SSH browser check, so `hub/master` and `hub/autobot` were still at `ce9109e` at the time of this note. Once Tailscale SSH is re-authorized, run the normal Windows sync with `-SyncHub` to mirror the current production refs to hub/Ubuntu.

## 2026-05-12 - Repair: Vyrill, Naoma AI, Hera expanded to full tool-card standard

- Replaced the earlier too-short Vyrill, Naoma AI, and Hera card bodies with full German and English editorial cards.
- Each repaired card now includes audience fit, use cases, practical workflow notes, features, pros/limits, workflow fit, privacy/data notes, pricing/costs, renderable internal alternatives, editorial assessment, and 5-item FAQ.
- Normalized alternatives to the renderable internal-link format (`[Tool](/tools/slug/): ...`) so the tool page template actually shows the alternatives grid.
- Rechecked editorial template, English translations, alternatives rendering, and the Astro production build before publication.

## 2026-05-12 - Ratgeber NotebookLM auth refreshed and visual upload unblocked

- Refreshed the local NotebookLM browser storage and copied the fresh `storage_state.json` to `opcl:/home/opcl/.notebooklm/storage_state.json`.
- Verified `scripts/notebooklm_auth_status.py` on `opcl`: `ok=true`, reason `notebooklm_auth_ready`, `notebook_count=21`.
- Manual runner checks after refresh:
  - `scripts/run_article_runner_host.sh` returned `ok=true` / no pending article jobs.
  - `scripts/run_article_rewrite_runner_host.sh` returned `ok=true` / `count=0`.
- Restored the Ratgeber Cloudflare candidate sync cron with `--allow-unapproved-visuals`, per current policy not to block review uploads on image quality while the contour lacks a reliable high-quality image-production stage.
- 2026-05-14: Added the next 50 varied editorial WebP illustrations for manually edited tool cards from Automation Anywhere through DataCamp; inserted localized DE/EN figure blocks and updated the illustration registry.
- 2026-05-15: Added the next 50 varied editorial WebP illustrations for active manually edited tool cards from Datadog through Google BigQuery; inserted localized DE/EN figure blocks, updated the illustration registry, and rejected generated variants with text/logo/dashboard artifacts.
- 2026-05-15: Added 30 varied editorial WebP illustrations for active manually edited tool cards from Google Chat through IBM Watson Speech to Text; inserted localized DE/EN figure blocks, updated the illustration registry, and rejected an early translation variant with symbol artifacts.

## 2026-05-18 - Vendor-card SEO repairs implemented

- Fixed high-risk vendor card issues: corrected Google Tasks and Google AI official URLs, deactivated duplicate Amazon/AWS, Google Cloud Translation, and Azure Synapse pages, and clarified the ambiguous `copilot` card as Assembly (formerly Copilot).
- Removed `copilot` from the Google force-index list so Microsoft Copilot remains the Google-priority Copilot page.
- Added `scripts/audit_vendor_tool_cards.mjs` plus `npm run audit:vendor`; the audit blocks known duplicate vendor pages, transient login/docs URLs, and ambiguous force-index entries.
- Added explicit Cloudflare Pages 301 redirects for disabled duplicate vendor slugs so stale static assets cannot keep returning 200 after deploy.

## 2026-05-21 - Compact thematic sitemap for search recovery

- Added a build-generated `sitemap-focus.xml` beside the existing Google and Bing sitemap files.
- Local build produced 96 focused URLs: core hubs/methodology, 24 German Ratgeber pages, 24 English Ratgeber pages, and 20 curated DE/EN tool-card pairs around AI assistants, coding agents, workflow automation, design/productivity, and BI.
- `robots.txt` remains unchanged and advertises only `https://tools.utildesk.de/sitemap.xml`; the focus sitemap is meant for explicit GSC/Bing submission, not broad crawler discovery.
- Production release commit: `9f08fcd9` (`seo: add focused sitemap`), published to `origin/master`, `origin/autobot`, and `hub`; direct Cloudflare Pages deploy was also used because the custom domain initially returned 404 for the new file.
- Live verification passed for `https://tools.utildesk.de/sitemap-focus.xml`: HTTP 200, XML content type, 96 `<loc>` entries, no machine endpoints, and `robots.txt` still lists only the main Google sitemap.
- Google Search Console submission succeeded for property `sc-domain:tools.utildesk.de`; API readback showed `lastSubmitted` and `lastDownloaded` on 2026-05-21, `warnings=0`, `errors=0`, and `submitted=96`.
- Bing Webmaster `SubmitFeed` succeeded for `https://tools.utildesk.de/sitemap-focus.xml`; immediate feed state was `Pending`, then `GetFeeds` refreshed to `Status=Success` and `UrlCount=96`, while broad `sitemap-bing.xml` stayed registered separately.
- IndexNow was submitted for all 96 focused canonical URLs to both `api.indexnow.org` and the direct Bing IndexNow endpoint; both returned HTTP 200.
﻿
## 2026-05-20 - Ratgeber hot-topic publication: AI agents, MCP governance, Vibe Coding

- Removed the duplicate `Browser-Agenten vs. Workflows` candidate from the NotebookLM/article pipeline and kept the already-published Browser-Agenten and AI Search Ratgeber pages as canonical.
- Created and manually edited three non-duplicate hot-topic Ratgeber articles in German and English:
  - `coding-agenten-2026-codex-claude-code-und-gemini-cli-im-entwickler-workflow`
  - `agent-security-und-mcp-governance-welche-guardrails-unternehmen-jetzt-brauchen`
  - `vibe-coding-nach-dem-hype-wie-teams-ai-code-pruefen-testen-und-reviewen`
- Generated two distinct narrative WebP illustrations per article via the ChatGPT/Codex OAuth image provider (`openai-codex`, not a standalone OpenAI API key) and inserted them as `coverImage` and `secondaryImage`.
- Ran `npm --prefix site run build`; build passed with 23 German and 23 English Ratgeber pages.
- Content commit: `96fb9b3f` (`content: publish AI agent workflow ratgeber`).
- Operational note: GitHub push alone did not make the new Ratgeber pages live within the first polling window, matching the 2026-05-12 behavior. Use `scripts/deploy_from_ubuntu.sh` or direct Wrangler Pages deployment if live URLs still return 404.

## 2026-05-23 - Catalog readability and masthead cleanup

- Improved the light-theme reading experience across the catalog homepage, tool detail pages, and Ratgeber detail pages by increasing practical contrast, text sizing, and content spacing.
- Moved the homepage `query_interface` and live feed blocks into the right `detail.preview` column, so the main hero has one clear editorial message instead of competing panels.
- Removed the nested right-column scrollbar by letting `detail.preview` grow with the page; the page now has one normal browser scroll.
- Replaced the rejected oversized rounded-card hero with a flatter compact masthead: Space Grotesk display title, subtle grid/green wash, and small stat pills under the intro copy.
- Verification before release: `npm --prefix site run build` passed with 3204 pages; direct Cloudflare Pages deployment `91446d24` was live-checked on `https://tools.utildesk.de/` with HTTP 200 and screenshot artifact `output/compact-masthead-live-production-light.png`.

## 2026-05-24 - Typography system cleanup

- Kept the live site typography to two active font roles: `Space Grotesk` for display headings and numeric emphasis, `JetBrains Mono` for catalogue/interface/body text.
- Removed the old inline `Plus Jakarta Sans` headings from German and English tool-detail alternative sections and replaced them with the shared `.alternatives-title` style.
- Fixed the 404 page to use the current `--display` and `--mono` font tokens instead of the stale `--font-mono` variable.
- Removed the unused legacy public stylesheet `site/public/styles/global.css`, which still described the old Inter/Plus Jakarta design system and was no longer imported by the Astro app.

## 2026-06-03 - Compact sitemap strategy for Google and Bing

- Live SEO check found no robots/fetch/canonical block on key pages, but Bing Webmaster still had broad `sitemap-bing.xml` registered alongside focused feeds.
- Policy audit found the broad Bing sitemap could include many long-tail URLs whose live pages returned global `noindex`, creating a mixed signal for Bing.
- Search strategy was changed away from broad sitemap submission: `sitemap.xml`, `sitemap-bing.xml`, and `sitemap-focus.xml` now all use the compact focus set: Ratgeber depth, core hubs/methodology, and the strongest curated tool cards.
- `scripts/bing_webmaster_api.py` now defaults feed submission to `https://tools.utildesk.de/sitemap-focus.xml`, and the postproduction pipeline submits only the focus sitemap to Bing.
- Bing Webmaster cleanup was performed immediately: removed registered `sitemap-bing.xml` and `sitemap.xml`, then resubmitted only `https://tools.utildesk.de/sitemap-focus.xml`; readback showed one feed, `UrlCount=102`, `Status=Pending` right after submission.
- Google Search Console compact sitemap was resubmitted for `sc-domain:tools.utildesk.de`; API returned `lastSubmitted=2026-06-03T21:10:12Z`, `warnings=0`, `errors=0`, while `lastDownloaded` remained the old 2026-05-21 value until Google recrawls it.
- IndexNow was submitted for all 102 live `sitemap-focus.xml` canonical URLs; both `https://api.indexnow.org/indexnow` and `https://www.bing.com/indexnow` returned HTTP 200.

## 2026-06-04 - Compact sitemap production deploy

- Committed the compact sitemap code as `1421f310` (`seo: compact search sitemaps`) and pushed it to `origin/master`.
- Cloudflare Git build for `1421f310` started, but a direct Cloudflare Pages deploy was used from verified local `site/dist` to avoid waiting on the long-running build. Direct deployment URL: `https://1ae7e7bf.utildesk-motia.pages.dev`.
- Live custom-domain verification passed immediately after deploy:
  - `https://tools.utildesk.de/sitemap.xml` -> `102` URLs;
  - `https://tools.utildesk.de/sitemap-bing.xml` -> `102` URLs;
  - `https://tools.utildesk.de/sitemap-focus.xml` -> `102` URLs;
  - `robots.txt` still advertises only `https://tools.utildesk.de/sitemap.xml`.
- Google Search Console main sitemap submit succeeded for `https://tools.utildesk.de/sitemap.xml`; final API readback after deploy showed `lastSubmitted=2026-06-04T11:13:09Z`, `lastDownloaded=2026-06-04T11:09:03Z`, `submitted=102`, `warnings=0`, `errors=0`.
- Bing Webmaster `sitemap-focus.xml` was resubmitted after deploy; follow-up feed readback showed `UrlCount=102`, `Status=Success`.

## 2026-06-04 - Qwant listing request

- Submitted the official Qwant website listing/contact form for `https://tools.utildesk.de/`.
- Used only non-personal project details: sender name `Utildesk`, email `utildesk@proton.me`, and a short note describing Utildesk as an editorial German/English AI tools directory with compact sitemap `https://tools.utildesk.de/sitemap.xml`.
- Qwant form returned the confirmation message: `Merci de nous avoir contacté ! Nous vous contacterons rapidement.`
- No personal first name, surname, or address was provided.

## 2026-06-08 - Whole-site mobile hardening pass

- Added a late decision-layout mobile hardening layer covering the homepage, inventory, tool detail, Ratgeber archive/articles, category/tag archives, methodology, imprint, and privacy pages.
- Mobile navigation now uses the black edition bar as the primary app-style nav, while the regular header is slimmed down to brand/liveness/language/theme utility controls to avoid the previous stacked desktop header on phones.
- Local QA covered DE/EN homepage, tools, tool detail, Ratgeber, category/tag, methodology, and legal routes at 390px, including load-more interaction and scroll-width checks.

## 2026-06-08 - Mobile header and footer alignment polish

- Added a final mobile-only decision-layout CSS layer so the compact language and `llms/feed` utility buttons render as true centered flex pills on phones instead of block-level text inside circular controls.
- Re-centered the mobile global footer and restored side padding so brand, editorial note, legal links, and feed link no longer hug the left viewport edge.
- Verification covered local dev and built `site/dist` at 390px on DE/EN homepage, tool index, Ratgeber index, ChatGPT tool detail, and privacy pages; header/footer metrics showed centered controls, centered footer links, no horizontal overflow, and no console errors.

## 2026-06-08 - Mobile homepage masthead balance

- Centered the homepage decision masthead on phones and widened the masthead subtitle to the available mobile width so it no longer reads like a narrow left-column label with an empty right half.
- Local mobile QA covered the homepage at 375px, 390px, and 430px; the masthead title/subtitle stayed centered, used the available width, and produced no horizontal overflow or console errors.

## 2026-06-14 - Sheet NEW hype tool publication batch

- Selected 20 high-signal `NEW` candidates from the Google Sheet source of truth and published full DE/EN editorial cards: `hugging-face-spaces`, `streamlit`, `gradio`, `litellm`, `anthropic-api`, `obsidian`, `roam-research`, `figjam`, `servicenow`, `apify`, `jax`, `d3-js`, `jupyter-notebook`, `trint`, `streamlabs`, `salesforce-lightning`, `callminer-eureka`, `nvidia-rtx-6000-ada-generation`, `ibm-api-connect`, `tibco-cloud-integration`.
- The legacy `scripts/publish_one_slug.mjs` path was attempted first on the production checkout, but the stored OpenAI API key returned 401; the touched Sheet row was reset from `IN_PROGRESS` back to `NEW`, then the batch was completed locally with manual full-card content.
- Updated `docs/04_operations/tool_card_editorial_registry.json` batch `2026-06-14-sheet-new-hype-20-publish`; generation intentionally kept the compact sitemap policy, so long-tail cards remain governed by the existing search-index rules instead of broad sitemap expansion.
- Verification before commit: English translations, `check:editorial`, `check:tool-quality`, internal alternative-link scan, manifest regeneration, and full `npm --prefix site run build`.

## 2026-06-14 - Sheet NEW hype 20 human editorial second pass

- Reworked the same 20 freshly published Sheet NEW tool cards with a broader manual editorial pass in German and English.
- Replaced the first-pass formulaic copy with tool-specific positioning, more concrete audience/use-case notes, sharper workflow caveats, privacy/cost considerations, stronger internal alternatives, and five-item FAQ blocks.
- Added editorial registry batch `2026-06-14-sheet-new-hype-20-human-polish`; future manual-card selections should continue skipping these slugs unless explicitly revisiting them.

## 2026-06-14 - OptiPlex Gemini illustrations for first three Sheet NEW tools

- Added Gemini-authored editorial illustrations for `hugging-face-spaces`, `streamlit`, and `gradio`, covering both DE/EN tool pages with shared WebP assets.
- OpenClaw `image_generate` on `jgdus-OptiPlex-3000` was checked first; Google Gemini image API, OpenRouter, and Hermes/FAL Nano Banana routes had no usable image credentials, so the final artwork was generated as SVG by Gemini CLI on OptiPlex and rendered to WebP with `ffmpeg`.
- Updated `docs/04_operations/tool_card_illustration_registry.json` batch `2026-06-14-optiplex-gemini-cli-first-3-sheet-new-illustrations`; future illustration batches should skip these slugs.
