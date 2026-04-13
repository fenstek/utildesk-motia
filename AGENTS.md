# AGENTS.md

This file provides project context for AI coding agents (OpenAI Codex, etc.).
It is the counterpart to CLAUDE.md and must be kept in sync with it.

---

## Project Overview

**Utildesk Motia** is an automated AI tools directory:
- Discovers and validates AI tools via LLM + Wikidata
- Stores tool metadata in Google Sheets (single source of truth)
- Generates German-language markdown pages in `content/tools/`
- Publishes to a static Astro site via automated cron pipeline
- Deploys to Cloudflare Pages from `master` branch

**Current state (2026-04-13):** ~751 published tools, pipeline fully operational.
**Last known good checkpoint:** `checkpoint-good-20260413` / commit `6b0053ab`

---

## Repository Structure

```
utildesk-motia/
├── scripts/        # Node.js automation pipeline
├── site/           # Astro v5 static site
├── content/        # Generated markdown (shared with site via symlink)
├── agent/          # Self-healing verification agent
├── compose/        # Docker Compose configs
└── docs/           # Project documentation
```

---

## Architecture: Non-Negotiable Rules

1. **Single orchestrator**: `scripts/test_run_9_full.mjs` is the only conductor.
   All other scripts are steps — never call them standalone.

2. **Google Sheet is source of truth**: every tool must flow through
   `NEW → IN_PROGRESS → DONE / ERROR` status states.

3. **No image generation**: only official favicons and SimpleIcons logos.

4. **Commit allowlist**: only `content/tools/*.md` may be auto-committed by cron.

5. **Content language**: all generated markdown must be in **German (DE)**.

6. **Protected master**: never push directly to `master`. All changes go via
   `autobot` branch → PR → auto-merge → Cloudflare Pages deploy.

---

## Critical Scripts (Do Not Remove or Rename)

| Script | Role |
|--------|------|
| `scripts/test_run_9_full.mjs` | Main orchestrator |
| `scripts/sheet_ai_autogen_9_strict_v2.mjs` | Tool discovery (LLM + Wikidata) |
| `scripts/sheet_get_next_new.mjs` | Fetch next NEW tool from Sheet |
| `scripts/sheet_set_status.mjs` | Update tool status in Sheet |
| `scripts/generate_tool_md.mjs` | Generate markdown from tool data |
| `scripts/finalize_md.mjs` | Finalize markdown frontmatter |
| `scripts/check_duplicates.mjs` | Prevent duplicate slugs |
| `scripts/cron_publish_push.sh` | Cron wrapper: publish → commit → PR → merge |

---

## Content Schema

Each tool is a markdown file `content/tools/<slug>.md`:

```yaml
---
slug: "tool-name"
title: "Tool Name"
category: "ai-chatbots"        # see 8 categories below
price_model: "freemium"        # free | freemium | paid
tags: ["ai", "chatbot"]
official_url: "https://example.com"
affiliate_url: "https://example.com"
---
```

**8 categories:** `ai-chatbots`, `schreiben-content`, `design-kreativ`,
`audio-video`, `produktivitaet`, `entwickler-tools`, `automatisierung`,
`marketing-vertrieb`

---

## Environment Variables (`.env` — never commit)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | LLM tool discovery |
| `SPREADSHEET_ID` | Google Sheet ID |
| `SHEET_NAME` | Sheet tab (default: `Tabellenblatt1`) |
| `SA_JSON_PATH` | Google Service Account JSON path |
| `CONTENT_DIR` | Output dir for markdown |
| `LANG` | Content language (`de`) |

---

## Checkpoints & Rollback

Good states are tracked in `CHECKPOINTS.md` as git tags.

**Current checkpoint:**
- Tag: `checkpoint-good-20260413`
- Commit: `6b0053ab`
- State: 751 tools published (on `master`), pipeline operational, clean working tree

**To roll back:**
```bash
git reset --hard checkpoint-good-20260413
```

Before any large change, create a new checkpoint:
```bash
git tag checkpoint-good-YYYYMMDD
# document it in CHECKPOINTS.md
```

---

## Site Development

```bash
cd site
npm run dev       # localhost:4321
npm run build     # production build
```

`site/content` is a symlink to `../content` — do not break it.

---

## Do Not

- Generate or commit images
- Push to `master` directly
- Skip Google Sheet status updates
- Remove or rename critical scripts listed above
- Write content in any language other than German
