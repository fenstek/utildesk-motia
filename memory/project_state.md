# Project State — utildesk-motia
_Last updated: 2026-03-23_

## Current Status: PRODUCTION ✅

### Live URLs
- **Production:** https://tools.utildesk.de/
- **GitHub:** https://github.com/fenstek/utildesk-motia
- **Cloudflare Pages:** utildesk-motia.pages.dev

### Master Branch State
- Commit: 19289df (merge of design/stitch-digital-atelier → master)
- Tools in content/: ~743
- Tools live on production: 639
- Design: **Stitch Digital Atelier** (merged 2026-03-23)

---

## Design System — Stitch Digital Atelier

### Key Files (design-only changes)
| File | Purpose |
|---|---|
| `site/public/styles/global.css` | **PRIMARY CSS** — always edit this file for design changes |
| `site/src/layouts/BaseLayout.astro` | Sticky glass header, footer |
| `site/src/pages/index.astro` | Homepage: hero with skewed accent, tag cloud, featured grid |
| `site/src/pages/tools/[slug].astro` | Tool detail: Direktlink box with logo, all-mentions linked |

> ⚠️ CRITICAL: `site/src/styles/global.css` is UNUSED. Astro serves
> `site/public/styles/global.css` as a static file directly.
> Always edit `public/styles/global.css`.

### Design Tokens
- Primary: `#176259` (teal) / Container: `#367b71`
- Surface: `#fafaf1` (warm white) / Lowest: `#ffffff`
- Fonts: Plus Jakarta Sans (headlines 600-800) + Inter (body)
- Radius: `--radius-lg: 2rem` / `--radius-full: 9999px`
- Shadows: ambient `rgba(26,28,23,0.04)`

### Backup
- Tag: `backup/master-pre-design-20260323-0559` (pushed to GitHub)
- Restoring: `git checkout backup/master-pre-design-20260323-0559`

---

## Pipeline Architecture

### Git Flow
```
autobot branch  ─── content only (tool .md files) ──→  PR ──→  master ──→ Cloudflare Pages
                                                                    ↑
                                              cron_publish_push.sh runs every 6h
```

### Cron Jobs (on VPS at /opt/utildesk-motia)
| Schedule | Job |
|---|---|
| `0 */6 * * *` | `cron_publish_push.sh` — generate content, PR to master |
| `15 */12 * * *` | `sheet_ai_autogen_9_strict_v2.mjs` — discover new tools |
| `10 2 * * *` | `sheet_seed_from_alternatives.mjs` — seed from alternatives |
| `10 4 * * *` | `sheet_rebuild_official_url.mjs` — repair NEEDS_REVIEW |
| `30 3 * * *` | `cron_umami_popularity.sh` — sync popularity scores |

### Key Paths
- **VPS working dir:** `/opt/utildesk-motia` (cron runs here)
- **VPS git clone:** `/root/utildesk-motia` (SSH alias: `utildesk`)
- **Logs:** `/var/log/utildesk-motia/`
- **Secrets:** `/opt/utildesk-motia/secrets/`

---

## Content Pipeline

### Google Sheet → Status flow
`NEW → IN_PROGRESS → DONE / ERROR / NEEDS_REVIEW / BLACKLIST`

### QC Pipeline
`scripts/run_sheet_qc_pipeline.sh` — validates all sheet data
Baseline: 513 rows, 0 errors, 0 warnings (as of last snapshot)

### Sheet Patches
- Always via `validate_sheet_patch.mjs` → `apply_sheet_patch.mjs`
- Never write directly to Sheet

---

## Autobot Self-Healing
cron_publish_push.sh has built-in self-heal:
- If autobot is behind master (ahead=0, behind>0): resets to master
- If autobot has local commits: continues with autobot
- After master design merge: next cron run will auto-pick up new design

---

## CLAUDE.md
Full architecture and constraints documented in `/root/utildesk-motia/CLAUDE.md`
Including Design System section added 2026-03-23.
