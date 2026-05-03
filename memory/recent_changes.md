# Recent Changes — utildesk-motia
_Last updated: 2026-05-04_

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
