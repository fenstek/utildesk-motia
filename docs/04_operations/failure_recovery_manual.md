---
title: Utildesk Motia — Failure Recovery Manual
---

# Utildesk Motia — Failure Recovery Manual

## Recovery Philosophy

1. Stop automation if the system is making incorrect changes
2. Diagnose using audit and logs
3. Fix using deterministic patches
4. Restart automation

Never attempt random or manual fixes.

## Quick Health Check

\\\ash
node scripts/audit_sheet_snapshot.mjs
bash scripts/run_sheet_qc_pipeline.sh
git status
git log --oneline -20
\\\

## Failure Scenarios

### QC Audit Fails (errors > 0)
1. Identify failing rows in audit report
2. Determine error category (invalid URL, taxonomy mismatch, missing tags, duplicate official_url)
3. Generate patch and apply via \alidate_sheet_patch.mjs\ + \pply_sheet_patch.mjs\
4. Re-run audit

### QC Pipeline Stuck (patch loop)
1. Stop automation cron job
2. Inspect latest patch files in \ackups/snapshots/\
3. Run audit manually and apply targeted fix

### Content Not Generated (no new files in content/tools/)
\\\ash
node scripts/sheet_ai_autogen_9_strict_v2.mjs
\\\

### Site Not Updating (repo updated but site unchanged)
Check GitHub commits and Cloudflare Pages build logs. Trigger manual build if needed.

### Cron Automation Stopped
\\\ash
crontab -l   # check cron
\\\

### Git Push Failure
Check SSH authentication and \git remote -v\. Re-authenticate if needed.

## Emergency Stop Procedure

1. Disable cron jobs
2. Prevent further commits
3. Run audit
4. Restore previous state if required: \git reset --hard <commit>\

## Log Locations

\\\
backups/snapshots/          # Snapshots
sheet_audit.*.json          # Audit reports
sheet_patch_apply.*.log     # Patch logs
\\\

## Escalation Protocol

If automated recovery fails: stop automation → collect logs → analyze root cause → manual intervention.
