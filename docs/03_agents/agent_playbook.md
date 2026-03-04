---
title: Utildesk Motia — Agent Playbook
---

# Utildesk Motia — Agent Playbook

## Core Principle

Agents must operate according to these principles:

- deterministic changes
- patch-based modifications
- no direct writes to critical data
- auditable actions

## Primary Agents

### Codex
Primary role: **Engineering and repository operations**.
- modify code, create scripts, refactor pipeline
- generate patches, run repository audits
- fix build issues

### Claude
Primary role: **Infrastructure and reasoning tasks**.
- debugging complex issues, analyzing system behavior
- planning architecture changes
- Claude should not directly modify the sheet or repository unless instructed.

### Automation Agents (n8n / cron)
Primary role: **Routine automation**.
- scheduled tasks, publishing, monitoring

## Operational Boundaries

Allowed: running scripts, creating patches, modifying repository code

Restricted: direct sheet writes, manual editing of generated content, bypassing QC pipeline

## Standard Agent Workflow

\\\
Detect issue → Run audit → Generate patch → Validate patch → Dry run → Apply patch → Re-run audit
\\\

## Content Automation Workflow

\\\
New tools discovered → Added to Google Sheet → QC validation → Content generation → Commit → Deploy
\\\

## Agent Command Reference

\\\ash
# Audit sheet
node scripts/audit_sheet_snapshot.mjs

# Run QC pipeline
bash scripts/run_sheet_qc_pipeline.sh

# Generate content
node scripts/sheet_ai_autogen_9_strict_v2.mjs

# Publish updates
bash scripts/cron_publish_push.sh
\\\

## Safety Policies

- Never bypass QC
- Never modify generated files manually
- Never introduce non-deterministic logic

## Failure Recovery

1. stop automation
2. run audit
3. identify root cause
4. apply deterministic patch
