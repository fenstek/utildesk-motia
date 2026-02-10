# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Utildesk Motia** is an automated AI tools directory that:
- Discovers and validates AI tools via LLM + Wikidata
- Stores tool metadata in Google Sheets (single source of truth)
- Generates German-language markdown pages in `content/tools/`
- Publishes to a static Astro site via automated cron pipeline
- Deploys to Cloudflare Pages from `master` branch

The project consists of three main components:
1. **Content Pipeline** (`scripts/`) - Node.js automation scripts
2. **Static Site** (`site/`) - Astro-based frontend
3. **Motia App** (`motia-app/`) - Separate Motia framework application (has its own CLAUDE.md)

## Key Architecture Principles

### The Pipeline Constitution
The automation follows a strict, immutable architecture defined in `scripts/AUTOMATION.md`:

1. **Single Orchestrator**: `scripts/test_run_9_full.mjs` is the only "conductor" that coordinates all pipeline steps
2. **Google Sheet as Source of Truth**: All tool data flows from a Google Sheet with status tracking (`NEW` → `IN_PROGRESS` → `DONE` / `ERROR`)
3. **Status Contract**: The orchestrator must update status in the sheet for every processed tool
4. **No Image Generation**: The pipeline uses official favicons/brand icons only (SimpleIcons, favicons) - never generate images
5. **Canonical Step Order**: Each tool goes through: get next → generate MD → finalize MD → check duplicates → mark done

### Content Generation Workflow

**For discovering new tools:**
```bash
# Auto-discover and validate AI tools, write to Google Sheet
FETCH_TIMEOUT_MS=6000 WIKIDATA_MIN_SITELINKS=15 AUTOGEN_MAX_LOOPS=200 \
  node scripts/sheet_ai_autogen_9_strict_v2.mjs 20
```

**For publishing tools to markdown:**
```bash
# Process N tools from Sheet (NEW → DONE)
node scripts/test_run_9_full.mjs 3
```

**Cron automation** (runs on VPS):
- Every 6 hours: `scripts/cron_publish_push.sh` - generates content, commits to `autobot` branch, creates PR to `master`, auto-merges
- Every 12 hours: `sheet_ai_autogen_9_strict_v2.mjs` - discovers new tools

### Critical Scripts (Do Not Remove)
These are required for the pipeline to function:
- `test_run_9_full.mjs` - Main orchestrator
- `sheet_ai_autogen_9_strict_v2.mjs` - Tool discovery
- `sheet_get_next_new.mjs` - Fetches next NEW tool from sheet
- `sheet_set_status.mjs` - Updates tool status in sheet
- `generate_tool_md.mjs` - Creates markdown from tool data
- `finalize_md.mjs` - Finalizes markdown frontmatter
- `check_duplicates.mjs` - Prevents duplicate slugs
- `cron_publish_push.sh` - Automated publish wrapper

## Environment & Secrets

Configuration is in `.env` at project root:
- `OPENAI_API_KEY` - OpenAI API for LLM-based tool discovery
- `SPREADSHEET_ID` - Google Sheet ID (source of truth)
- `SHEET_NAME` - Sheet tab name (default: "Tabellenblatt1")
- `SA_JSON_PATH` - Path to Google service account JSON (`/opt/utildesk-motia/secrets/`)
- `CONTENT_DIR` - Output directory for generated markdown
- `LANG` - Content language (de)

**WARNING**: The `.env` file contains live credentials. Never commit changes to it.

## Site Building & Deployment

The static site lives in `site/`:

```bash
cd site

# Development
npm run dev          # Start dev server at localhost:4321

# Production build
npm run build        # Build to dist/
npm run preview      # Preview production build

# Asset management
npm run fetch:logos  # Download SimpleIcons logos
```

**Important**: `site/content` is a symlink to `../content` - the site reads markdown from the shared content directory.

**Deployment**: Cloudflare Pages automatically deploys the `master` branch. Do not push directly to `master` - all changes go through the `autobot` → PR → merge flow.

## Git Workflow

The project uses a **protected `master` branch** with automated PR workflow:

1. All automation commits go to `autobot` branch
2. `cron_publish_push.sh` creates a PR from `autobot` → `master`
3. PR is auto-merged via `gh pr merge --merge --admin`
4. Cloudflare Pages deploys after merge

**Branch protection**: Direct pushes to `master` are blocked. Changes MUST go through PRs.

**Commit allowlist**: Cron only commits files matching `content/tools/*.md` - any other changes abort the pipeline.

## Content Structure

Each tool gets:
- A markdown file in `content/tools/<slug>.md` with frontmatter (slug, title, category, tags, URLs)
- German-language content with fixed structure: description, target audience, features, pros/cons, pricing, alternatives, FAQ

The frontmatter schema:
```yaml
---
slug: "tool-name"
title: "Tool Name"
category: "AI"
price_model: "freemium|free|paid"
tags: ["ai", "chatbot", "text"]
official_url: "https://example.com"
affiliate_url: "https://example.com"
---
```

## Common Development Tasks

**Add new tools manually:**
1. Add row to Google Sheet with required fields (topic, slug, category, tags, price_model, official_url)
2. Set status to `NEW`
3. Run `node scripts/test_run_9_full.mjs 1`

**Regenerate single tool:**
1. Create `/tmp/utildesk_current_tool.json` with tool data
2. Run `node scripts/generate_tool_md.mjs /tmp/utildesk_current_tool.json`
3. Run `node scripts/finalize_md.mjs /tmp/utildesk_current_tool.json`

**Test URL resolution:**
```bash
node scripts/resolve_official_url_ddg_v1.mjs
```

**Check for duplicate slugs:**
```bash
node scripts/check_duplicates.mjs
```

## Debugging & Logs

Cron logs on VPS:
- `/var/log/utildesk-motia/publish.log` - Content generation and PR flow
- `/var/log/utildesk-motia/sheet.log` - Tool discovery

Manual cron test:
```bash
cd /opt/utildesk-motia && bash scripts/cron_publish_push.sh
```

Temporary pipeline state:
- `/tmp/utildesk_current_tool.json` - Current tool being processed

## Important Constraints

1. **Never generate images** - The pipeline is explicitly configured to skip image generation
2. **Never bypass status tracking** - All tools must flow through Google Sheet status states
3. **Never commit outside allowlist** - Only `content/tools/*.md` should be auto-committed
4. **Never break the orchestrator pattern** - Individual scripts are "steps", not standalone tools
5. **Content is German** - All generated markdown must be in German language

## Motia App (Separate Subproject)

The `motia-app/` directory is a separate Motia framework application with its own:
- CLAUDE.md file (comprehensive guide for Motia development)
- `.cursor/rules/` with 11 comprehensive MDC guides
- Independent development workflow

See `motia-app/CLAUDE.md` for Motia-specific guidance. When working on Motia code, reference the cursor rules in `motia-app/.cursor/rules/motia/`.
