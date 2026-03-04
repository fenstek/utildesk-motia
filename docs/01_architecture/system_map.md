---
title: Utildesk Motia — Master System Map
---

# Utildesk Motia — Master System Map

## Core Concept

Utildesk Motia is a **sheet-driven AI tools directory**.

All data originates from a **Google Sheet**, passes through a **deterministic QC pipeline**, generates **static content**, and is deployed automatically.

## System Architecture

\\\
Google Sheet
     ↓
QC Pipeline (Node scripts)
     ↓
Content Generator (content/tools/*.md)
     ↓
Astro Static Site
     ↓
GitHub Repository
     ↓
Cloudflare Pages
     ↓
Public Website
\\\

Supporting infrastructure: VPS (Hetzner), GitHub, Cloudflare

## Data Layer

Google Sheet contains tool metadata: slug, name, category, tags, official_url, pricing model, description.

The sheet acts as the **single source of truth**.

## Quality Control Layer

Key scripts:
\\\
audit_sheet_snapshot.mjs
run_sheet_qc_pipeline.sh
validate_sheet_patch.mjs
apply_sheet_patch.mjs
\\\

Rows with these statuses are skipped: blacklist, disabled, duplicate, alias

## Content Generation

Generator: \sheet_ai_autogen_9_strict_v2.mjs\
Output: \content/tools/<slug>.md\

## Deployment Layer

Git-driven: VPS commit → GitHub → Cloudflare Pages build → Site deployment

## Automation Layer

\\\
cron → content generation → QC pipeline → commit + push → Cloudflare deploy
\\\

Key script: \cron_publish_push.sh\

## Observability

- Snapshots: \ackups/snapshots/\
- Audit reports: \ackups/snapshots/sheet_audit.*.json\
- Patch history: \ackups/snapshots/sheet_patch.*.json\
- Recent changes: \memory/recent_changes.md\

## Quick Mental Model

Sheet data → QC verification → Content generation → Static site build → Automated deployment

Every step is deterministic and auditable.
