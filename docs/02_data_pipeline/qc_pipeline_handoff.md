---
title: Utildesk Motia — QC / Sheet Pipeline Bootstrap Handoff
---

# Utildesk Motia — QC / Sheet Pipeline Bootstrap Handoff

## Project State (Green Baseline)

- rows: **513**
- **errors = 0**
- **warnings = 0**
- skipped: **69** (skipped_blacklist_or_disabled: 64, skipped_duplicate_or_alias: 5)

\\\ash
node scripts/audit_sheet_snapshot.mjs
# AUDIT_PASS rows=513 errors=0 warnings=0 skipped=69
\\\

## QC Pipeline Behavior

\\\ash
bash scripts/run_sheet_qc_pipeline.sh --focus mixed --proposer stub
# Expected: SHEET_SNAPSHOT_STATUS=OK / AUDIT_PASS / PIPELINE_PASS
\\\

If audit passes, the pipeline **does not run proposer/validate/apply stages**.

## Core Invariants

1. **Google Sheet writes are only allowed via patch pipeline.** Never write directly.
   Flow: snapshot → audit → propose patch → validate patch → dry-run apply → strict apply

2. **QC eligibility policy**: rows with statuses blacklist/disabled/duplicate/alias are skipped.

## Policy Adjustments

### HuggingFace Exception
\https://huggingface.co/\ is allowed as official URL (hosts tool landing pages directly).
Generic roots like \https://github.com/\ are still rejected.

## Tags System

All tags normalized: lowercase, trim, no duplicates, stable ordering, ASCII normalization.

Missing tags resolved via two-phase approach: category-based mapping + MISSING_TAGS_OVERRIDES_BY_SLUG.

## Duplicate official_url Resolution

Canonical selection rules: prefer DONE slug → shorter slug → lower row index.

| canonical | duplicate |
|----------|-----------|
| intellicode | visual-studio-intellicode |
| ai21-labs | ai21-studio |
| anthropic | claude-von-anthropic |
| canva-video | canva-video-editor |
| make-ehemals-integromat | integromat |

## Key Artifacts

\\\
backups/snapshots/sheet_snapshot.latest.json
backups/snapshots/sheet_audit.latest.json
backups/snapshots/sheet_patch.*.json
memory/recent_changes.md
\\\

## Next Logical Improvements

1. Add stable warning codes to audit output.
2. Increase automation for new tool ingestion.
3. Resume automated publishing.
4. Infrastructure hardening (firewall, monitoring, backups).
