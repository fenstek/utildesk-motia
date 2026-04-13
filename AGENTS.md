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

**Current state (2026-04-13):**
- 751 published tools, 105 disabled/template entries (856 total in `content/tools/`)
- Pipeline fully operational, cron runs every 6h (publish) and 12h (discovery)
- Design system: teal primary `#176259`, fonts: Plus Jakarta Sans + Inter

**Last known good checkpoint:** `checkpoint-good-20260413` → commit `2076e04` (HEAD of `master`)

---

## Repository Structure

```
utildesk-motia/
├── scripts/        # Node.js automation pipeline (100+ scripts)
├── site/           # Astro v5 static site
├── content/        # Generated markdown (shared with site via symlink)
├── agent/          # Self-healing verification agent
├── backups/        # Snapshot backups of sheet patches and audit logs
├── compose/        # Docker Compose configs (prod, traefik)
├── docs/           # Architecture and operational documentation
├── memory/         # Pipeline state/logs
├── reports/        # Audit and report outputs
└── CLAUDE.md / AGENTS.md / CHECKPOINTS.md
```

---

## Architecture: Non-Negotiable Rules

1. **Single orchestrator**: `scripts/test_run_9_full.mjs` is the only conductor.
   All other scripts are steps — never call them standalone.

2. **Google Sheet is source of truth**: every tool must flow through
   `NEW → IN_PROGRESS → DONE / ERROR` status states.
   Extended states: `NEEDS_REVIEW`, `REBUILD`, `DISABLED`, `BLACKLIST`.

3. **Triple publish gates (v2.3):**
   - Gate 1: `official_url` validated in autogen
   - Gate 2: at least 1 specific tag required
   - Gate 3: `official_url` re-checked in orchestrator

4. **No image generation**: only official favicons and SimpleIcons logos.

5. **Commit allowlist**: only `content/tools/*.md` may be auto-committed by cron.

6. **Content language**: all generated markdown must be in **German (DE)**.

7. **Protected master**: never push directly to `master`. All changes go via
   `autobot` branch → PR → auto-merge → Cloudflare Pages deploy.

8. **Two-phase finalization**: pre-commit defer status if MD untracked,
   post-commit finalize when MD verified tracked.

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

### Shared Library (`scripts/lib/`)

| Module | Role |
|--------|------|
| `category_matcher.mjs` | Maps tags to 8 German categories |
| `official_url_chooser_gpt.mjs` | GPT URL selection |
| `tag_enricher_gpt.mjs` | GPT tag enrichment |
| `tag_policy.mjs` | Tag validation rules |
| `url_policy.mjs` | URL validation rules |
| `url_suspicion.mjs` | Detects parked/suspicious domains |
| `http_verify_url.mjs` | HTTP reachability check |
| `publish_status_guards.mjs` | Gate enforcement |
| `price_model_policy.mjs` | Price model normalization |
| `entity_disambiguation.mjs` | Wikidata entity disambiguation |
| `html_sniff_parking.mjs` | Parked page detection |

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

Disabled tools are prefixed with `_` (e.g. `_toolname.md`) and excluded from publishing.

---

## Static Site (`site/`)

**Framework:** Astro v5 + MDX

```
site/
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── tools/[slug].astro
│   │   ├── category/[slug].astro
│   │   ├── tag/[slug].astro
│   │   ├── impressum.astro
│   │   └── datenschutz.astro
│   └── lib/
│       ├── categories.ts
│       ├── resolveLogoPath.ts
│       ├── priceModel.ts
│       └── tagRoutes.ts
├── public/
│   └── styles/global.css     # ← design system lives here (NOT src/styles/)
├── functions/                 # Cloudflare Workers
└── content → ../content       # symlink — do not break
```

**CSS note:** Design tokens are in `site/public/styles/global.css`.
Primary color: `#176259` (teal). Fonts: Plus Jakarta Sans + Inter.

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
| `CF_API_TOKEN` | Cloudflare API token (production status checks) |
| `CF_ACCOUNT_ID` | Cloudflare account ID |
| `CF_PROJECT_NAME` | Cloudflare Pages project name |

---

## Cron Automation

| Schedule | Script | Lock file |
|----------|--------|-----------|
| Every 6h | `cron_publish_push.sh` | `/tmp/utildesk-motia_publish.lock` |
| Every 12h | `sheet_ai_autogen_9_strict_v2.mjs` | `/tmp/utildesk-motia_sheet.lock` |

Logs: `/var/log/utildesk-motia/publish.log`, `/var/log/utildesk-motia/sheet.log`

Default batch size: 10 tools per run (override: `PUBLISH_BATCH_SIZE` env var or CLI arg).

---

## Documentation (`docs/`)

```
docs/01_architecture/system_map.md
docs/02_data_pipeline/qc_pipeline_handoff.md
docs/03_agents/agent_playbook.md
docs/04_operations/failure_recovery_manual.md
docs/04_operations/runtime_vps_deploy.md
docs/AUTOPILOT_CRON_STATE.md
docs/status_pipeline.md
docs/project-overview.md      # Russian-language project overview
```

---

## Checkpoints & Rollback

Good states are tracked in `CHECKPOINTS.md` as git tags.

**Current checkpoint:**
- Tag: `checkpoint-good-20260413`
- Commit: `2076e04` (HEAD of `master`, 2026-04-13)
- State: 751 tools published, pipeline operational, clean working tree

**To roll back:**
```bash
git reset --hard checkpoint-good-20260413
```

Before any large change, create a new checkpoint:
```bash
git tag checkpoint-good-YYYYMMDD <master-sha>
# document it in CHECKPOINTS.md
```

---

## Hard Overrides & Known Edge Cases

- **Prisma Labs** (`prisma-ai.com`): manual slug override to avoid collision with Prisma ORM
- Disabled tools (`_` prefix) must never appear in published output — verified by `agent/checks/disabled_tools.mjs`

---

## Do Not

- Generate or commit images
- Push to `master` directly
- Skip Google Sheet status updates
- Remove or rename critical scripts listed above
- Write content in any language other than German
- Edit `site/public/styles/global.css` without understanding the design token system
