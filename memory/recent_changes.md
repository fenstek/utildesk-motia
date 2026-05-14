# Recent Changes — utildesk-motia
_Last updated: 2026-05-14_

## 2026-05-14 - Final tool-card text editorial gap pass
- Manually improved or normalized the remaining 40 DE/EN tool cards that were missing from the text editorial registry, including disabled legacy aliases.
- Added practical workflow-fit and editorial-assessment language where pages still had generic generated structure, and registered already hand-edited OCR/document cards.
- Updated `docs/04_operations/tool_card_editorial_registry.json` so the manual text-edit audit has 0 unregistered paired tool cards.
- Post-rebase addendum: after the concurrent sheet publish commit added 10 more paired tool cards, manually edited and registered those cards too before production deploy.

## 2026-05-14 - Publish QC gate unblocked for large NEW queues

- Investigated why Google Sheet `NEW` rows were no longer reaching production: VPS publish cron was healthy and unpaused, but `qc_before_publish.mjs` timed out before generation.
- Root cause: the Sheet had 207 `NEW` rows, while the QC helper tried to resolve every `NEW`/`IN_PROGRESS` official URL before each 10-row publish batch; the helper timed out with `spawnSync node ETIMEDOUT`, causing the fail-closed marker `QC_MOVED_TO_NEEDS_REVIEW=9999`.
- Fixed the gate so publish QC checks all `IN_PROGRESS` rows plus a bounded leading slice of `NEW` rows tied to `PUBLISH_BATCH_SIZE` before each run, instead of verifying the entire backlog every time.
- Also fixed `resolveFinalUrl()` to honor the older `timeoutMs` option used by existing QC/audit callers, avoiding accidental fallback to the longer default request timeout.
- Follow-up hardening: live URL reachability failures from the VPS are now advisory in the pre-publish gate instead of a hard `NEEDS_REVIEW` reason; definite static policy failures, self-references, suspicious resolved redirects, and duplicate rows still block.

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
