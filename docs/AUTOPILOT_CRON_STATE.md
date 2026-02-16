# Autopilot Cron State

## Active Cron Jobs

### 1. Publish Pipeline
**Schedule**: `0 */6 * * *` (every 6 hours)
**Lock**: `/tmp/utildesk-motia_publish.lock`
**Log**: `/var/log/utildesk-motia/publish.log`
**Script**: `scripts/cron_publish_push.sh`

Publishes DONE tools to site, commits, and pushes to repository.

---

### 2. Sheet AI Autogen
**Schedule**: `15 */12 * * *` (every 12 hours, at :15)
**Lock**: `/tmp/utildesk-motia_sheet.lock`
**Log**: `/var/log/utildesk-motia/sheet.log`
**Script**: `scripts/sheet_ai_autogen_9_strict_v2.mjs`

Processes NEW rows in Google Sheet:
- Validates official_url
- Fetches Wikidata metadata
- Generates AI content
- Creates markdown files in content/tools/
- Updates status to DONE

**Limits**: 20 rows per run
**Environment**:
- `FETCH_TIMEOUT_MS=6000`
- `WIKIDATA_MIN_SITELINKS=15`
- `AUTOGEN_MAX_LOOPS=200`

---

### 3. Audit DONE vs Repo
**Schedule**: `30 3 * * *` (daily at 03:30 UTC)
**Lock**: `/tmp/utildesk-motia_audit.lock`
**Log**: `/var/log/utildesk-motia/audit.log`
**Script**: `scripts/audit_done_vs_repo.mjs`

Audits consistency between DONE rows in Sheet and actual files in content/tools/.

---

### 4. Alternatives Seed
**Schedule**: `10 2 * * *` (daily at 02:10 UTC)
**Lock**: `/tmp/utildesk-motia_alternatives.lock`
**Log**: `/var/log/utildesk-motia/alternatives.log`
**Scripts**:
1. `scripts/audit_alternatives_render.mjs --json` → generates `/tmp/audit_alternatives_render_v2.json`
2. `scripts/sheet_seed_from_alternatives.mjs --apply --limit 20` → seeds NEW rows from missing alternatives

Scans alternatives sections in existing tools, extracts tools not yet in content/tools/, and adds them to Sheet with status=NEW and notes=ALT_SEED.

**Limits**: 20 new rows per run
**Deduplication**: By slug, topic, and file existence

---

### 5. NEEDS_REVIEW Rebuild
**Schedule**: `10 4 * * *` (daily at 04:10 UTC)
**Lock**: `/tmp/utildesk-motia_needs_review.lock`
**Log**: `/var/log/utildesk-motia/needs_review.log`
**Script**: `scripts/sheet_rebuild_official_url.mjs`

Processes NEEDS_REVIEW rows:
- Resolves official_url using DDG + GPT
- Validates candidates (HTTP check, brand token matching)
- Updates official_url and changes status to NEW if successful

**Flags**: `--status NEEDS_REVIEW --use-gpt --gpt-fallback --strict --apply --limit 20`
**GPT Usage**: OpenAI API for URL resolution and validation

---

## Pipeline Flow

```
Alternatives Seed (02:10)
    ↓ adds NEW rows with notes=ALT_SEED

NEEDS_REVIEW Rebuild (04:10)
    ↓ processes NEEDS_REVIEW → NEW

Audit (03:30)
    ↓ checks consistency

Sheet AI Autogen (every 12h)
    ↓ processes NEW → DONE

Publish (every 6h)
    ↓ publishes DONE → site
```

---

## Lock Files

All jobs use `flock -n` to prevent concurrent execution:
- `/tmp/utildesk-motia_publish.lock`
- `/tmp/utildesk-motia_sheet.lock`
- `/tmp/utildesk-motia_audit.lock`
- `/tmp/utildesk-motia_alternatives.lock`
- `/tmp/utildesk-motia_needs_review.lock`

---

## Monitoring

Check logs:
```bash
# Recent activity
sudo tail -f /var/log/utildesk-motia/alternatives.log
sudo tail -f /var/log/utildesk-motia/needs_review.log
sudo tail -f /var/log/utildesk-motia/sheet.log
sudo tail -f /var/log/utildesk-motia/publish.log

# Summary
sudo ls -lh /var/log/utildesk-motia/
```

Check cron status:
```bash
crontab -l | grep utildesk
```

---

## Last Updated

2026-02-16: Added alternatives seed pipeline and NEEDS_REVIEW rebuild documentation.
