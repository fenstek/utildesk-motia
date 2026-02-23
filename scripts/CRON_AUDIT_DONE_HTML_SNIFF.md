# CRON_AUDIT_DONE_HTML_SNIFF

Daily dry-run audit of all DONE rows using the HTML-sniff parking detector.

## Why

`resolveFinalUrl()` follows HTTP redirects only. Some parked domains serve HTTP 200
with a JS redirect (`window.location.href="/lander"`) — invisible to URL-level checks.

The `--html-sniff` flag fetches the page body (≤64 KiB, 6 s timeout) and pattern-matches
against known parking signals:
- JS redirects to `/lander`, `/parking`, `/for-sale`
- `<meta http-equiv="refresh">` to parking paths
- Known parking providers (parkingcrew, afternic, hugedomains, sedo, dynadot…)
- For-sale copy ("buy this domain", "domain for sale")

**Examples caught:** `coda.ai`, `clearscope.ai`, `lifelike.io` — all HTTP 200
with `window.location.href="/lander"`, redirect to afternic/godaddy for-sale pages.

## Cron schedule

```
15 3 * * *  bash /opt/utildesk-motia/scripts/cron_audit_done_html_sniff.sh >/dev/null 2>&1
```

Runs at **03:15 UTC daily**. Never modifies the Sheet. Exit code always 0.

## Manual run

```bash
bash /opt/utildesk-motia/scripts/cron_audit_done_html_sniff.sh
```

Override the row limit (default 2000):

```bash
AUDIT_LIMIT=500 bash /opt/utildesk-motia/scripts/cron_audit_done_html_sniff.sh
```

## Reports

Written to:

```
/opt/utildesk-motia/reports/audit_done_html_sniff_daily_YYYYMMDD_HHMM.md
```

Each report contains:
- Summary table (scanned / clean / hard-flagged / js-parking / soft-flagged)
- Next-steps guidance (if js_parking_count > 0)
- Full JSON output from the audit script

## What to do when js_parking_count > 0

1. Open the report → find `js_parking_rows` array.
2. For each flagged slug, identify the real official URL (web research).
3. Update Sheet via:
   ```bash
   node scripts/sheet_set_official_url.mjs <row> <new_url>
   node scripts/sheet_set_status.mjs <row> NEW
   node scripts/sheet_set_notes.mjs <row> "FIX: html-sniff parked; set official_url <url>; set NEW; YYYY-MM-DD"
   ```
4. Validate the new URL:
   ```bash
   node --input-type=module <<'EOF'
   import { resolveFinalUrl } from './scripts/lib/http_verify_url.mjs';
   import { sniffHtmlParking } from './scripts/lib/html_sniff_parking.mjs';
   const r = await resolveFinalUrl('https://new-url.com/');
   const s = await sniffHtmlParking(r.finalUrl);
   console.log(r.ok, r.status, s.detected);
   EOF
   ```
5. Run publish pipeline:
   ```bash
   PUBLISH_BATCH_SIZE=3 bash scripts/cron_publish_push.sh
   ```
6. Post-check live site.

If the real official URL cannot be found, set status to NEEDS_REVIEW instead of NEW.

## What to do when flagged_count > 0

Review manually. Known false positive: `semantic-scholar` (`suspicious_tld_org_net`).
If new hard flags appear, investigate before applying.

## Related files

| File | Description |
|------|-------------|
| `scripts/lib/html_sniff_parking.mjs` | Core detector module (patterns, HTTP fetch) |
| `scripts/test_html_sniff_parking.mjs` | Unit + live tests for the detector |
| `scripts/audit_done_suspicious_official_url.mjs` | Main audit script (v1.4, supports --html-sniff) |
| `reports/audit_done_html_sniff_daily_*.md` | Daily audit reports |
