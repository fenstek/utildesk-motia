# Recent Changes — utildesk-motia
_Last updated: 2026-05-11_

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
