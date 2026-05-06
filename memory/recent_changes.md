# Recent Changes — utildesk-motia
_Last updated: 2026-05-06_

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
