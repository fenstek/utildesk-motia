---
title: Utildesk Motia — Runtime / VPS / Deploy Handoff
---

# Utildesk Motia — Runtime / VPS / Deploy Handoff

## Runtime Architecture

\\\
Google Sheet → QC Pipeline → Content Generator → Astro Static Site → GitHub → Cloudflare Pages → Public Site
\\\

Supporting services: VPS (Hetzner), cron automation, GitHub, Cloudflare

## Repository Structure

\\\
scripts/
content/
content/tools/
backups/
backups/snapshots/
memory/
\\\

## VPS Environment

Location: \/root/utildesk-motia\

Responsibilities: run cron jobs, execute QC pipeline, generate tool content, push commits to GitHub.

## Automation (Cron)

\cron_publish_push.sh\ — updates repo, runs generation, runs QC, commits, pushes to GitHub.

## Deployment Flow

VPS commit → GitHub repository → Cloudflare Pages build → site deploy (no direct VPS hosting for public site).

## Safety Layers

- Layer 1 — QC pipeline (URLs, taxonomy, tags, duplicates)
- Layer 2 — Patch system (\alidate_sheet_patch.mjs\ / \pply_sheet_patch.mjs\)
- Layer 3 — Eligibility filters (blacklist/disabled/duplicate/alias rows skipped)

## Common Commands

\\\ash
node scripts/audit_sheet_snapshot.mjs
bash scripts/run_sheet_qc_pipeline.sh
node scripts/sheet_ai_autogen_9_strict_v2.mjs
bash scripts/cron_publish_push.sh
\\\

## Logs and Artifacts

\\\
backups/snapshots/          # Snapshots
backups/snapshots/sheet_patch.*.json    # Patch history
backups/snapshots/sheet_audit.*.json   # Audit reports
memory/recent_changes.md               # Project memory
\\\

## Operational Rules

1. Never bypass QC pipeline
2. Never write directly to sheet
3. Always validate patches
