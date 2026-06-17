#!/usr/bin/env bash
set -euo pipefail

FOCUS=""
PROPOSER=""
PASSTHRU=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --focus)
      FOCUS="${2:-}"
      shift 2
      ;;
    --proposer)
      PROPOSER="${2:-}"
      shift 2
      ;;
    *)
      PASSTHRU+=("$1")
      shift
      ;;
  esac
done

if [[ -n "$FOCUS" || -n "$PROPOSER" ]]; then
  echo "[qc-pipeline] focus=${FOCUS:-default} proposer=${PROPOSER:-default}"
fi

echo "[qc-pipeline] audit_sheet_snapshot"
node scripts/audit_sheet_snapshot.mjs "${PASSTHRU[@]}"

echo "[qc-pipeline] audit_new_inprogress_qc"
node scripts/audit_new_inprogress_qc.mjs --json

echo "[qc-pipeline] check_duplicates"
node scripts/check_duplicates.mjs

echo "[qc-pipeline] qc_before_publish self-test"
node scripts/qc_before_publish.mjs --self-test

echo "[qc-pipeline] OK"
