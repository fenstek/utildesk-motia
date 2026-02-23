#!/usr/bin/env bash
# cron_audit_done_html_sniff.sh
#
# Daily dry-run audit of DONE rows with --html-sniff detector.
# Detects JS-redirect parking pages that bypass HTTP-only URL verification.
# NEVER modifies the Sheet (no --apply). Results go to reports/ only.
#
# Cron: 03:15 daily
#   15 3 * * * bash /opt/utildesk-motia/scripts/cron_audit_done_html_sniff.sh >/dev/null 2>&1
#
# See: scripts/CRON_AUDIT_DONE_HTML_SNIFF.md

set -euo pipefail

REPO_DIR="/opt/utildesk-motia"
REPORTS_DIR="${REPO_DIR}/reports"
LIMIT="${AUDIT_LIMIT:-2000}"
TIMESTAMP="$(date -u +%Y%m%d_%H%M)"
REPORT_FILE="${REPORTS_DIR}/audit_done_html_sniff_daily_${TIMESTAMP}.md"

echo "[html-sniff-audit] start: ts=$(date -Is) pid=$$"

cd "$REPO_DIR"

# ── Generate JSON report ──────────────────────────────────────────────────────
JSON_OUT="$(node scripts/audit_done_suspicious_official_url.mjs \
  --html-sniff \
  --limit="${LIMIT}" \
  --json \
  2>&1)" || true   # never fail cron

# ── Parse key metrics from JSON ───────────────────────────────────────────────
TOTAL="$(echo "$JSON_OUT"   | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim()); process.stdout.write(String(d.total_done_checked??'?'))" 2>/dev/null || echo '?')"
CLEAN="$(echo "$JSON_OUT"   | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim()); process.stdout.write(String(d.clean_count??'?'))" 2>/dev/null || echo '?')"
FLAGGED="$(echo "$JSON_OUT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim()); process.stdout.write(String(d.flagged_count??'?'))" 2>/dev/null || echo '?')"
SOFT="$(echo "$JSON_OUT"    | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim()); process.stdout.write(String(d.soft_flags_count??'?'))" 2>/dev/null || echo '?')"
JSPARK="$(echo "$JSON_OUT"  | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim()); process.stdout.write(String(d.js_parking_count??'?'))" 2>/dev/null || echo '?')"

# ── Write Markdown report ─────────────────────────────────────────────────────
cat > "$REPORT_FILE" <<MDEOF
# DONE Audit — HTML Sniff Daily — $(date -u +%Y-%m-%d) $(date -u +%H:%M) UTC

**Mode:** dry-run (no --apply, Sheet read-only)
**Command:** \`node scripts/audit_done_suspicious_official_url.mjs --html-sniff --limit=${LIMIT} --json\`

## Summary

| Metric | Value |
|--------|-------|
| DONE rows scanned | ${TOTAL} |
| Clean | ${CLEAN} |
| Hard-flagged | ${FLAGGED} |
| JS-parking (html-sniff) | ${JSPARK} |
| Soft-flagged | ${SOFT} |

## Next Steps

$(if [ "$JSPARK" != "0" ] && [ "$JSPARK" != "?" ]; then
  echo "**ACTION REQUIRED:** \`js_parking_count=${JSPARK}\` — run with \`--apply=1\` to move to NEEDS_REVIEW, then fix official_url manually."
else
  echo "No js-parking detections. No action required."
fi)

$(if [ "$FLAGGED" != "0" ] && [ "$FLAGGED" != "?" ]; then
  echo "**HARD FLAGS:** \`flagged_count=${FLAGGED}\` — review manually (may include known false positives like semantic-scholar)."
fi)

## Raw JSON Output

\`\`\`json
$(echo "$JSON_OUT" | python3 -m json.tool 2>/dev/null || echo "$JSON_OUT")
\`\`\`
MDEOF

echo "[html-sniff-audit] report written: ${REPORT_FILE}"
echo "[html-sniff-audit] total=${TOTAL} clean=${CLEAN} flagged=${FLAGGED} js_parking=${JSPARK} soft=${SOFT}"
echo "[html-sniff-audit] done: ts=$(date -Is)"

# Always exit 0 so cron does not redline
exit 0
