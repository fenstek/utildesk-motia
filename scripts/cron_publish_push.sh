#!/usr/bin/env bash
set -euo pipefail

START_TS="$(date -Is)"
SELF_PID="$$"
LOCK_FILE="${LOCK_FILE:-/tmp/utildesk-motia_publish.lock}"

echo "pid=${SELF_PID} started=${START_TS}" > "$LOCK_FILE"
trap 'echo "pid=${SELF_PID} finished=$(date -Is) exit=$?" > "$LOCK_FILE"' EXIT

echo "[cron] boot: ts=${START_TS} pid=${SELF_PID} lock_file=${LOCK_FILE}"

cd /opt/utildesk-motia

PUBLISH_PAUSE_FILE="${PUBLISH_PAUSE_FILE:-/opt/utildesk-motia/.publish_paused}"
if [[ -f "$PUBLISH_PAUSE_FILE" ]]; then
  echo "[cron] publish paused (flag: $PUBLISH_PAUSE_FILE) -> exit 0"
  exit 0
fi

retry_cmd() {
  local max="$1"
  shift
  local n=0
  while true; do
    "$@" && return 0
    n=$((n+1))
    if [[ "$n" -ge "$max" ]]; then
      return 1
    fi
    echo "[cron] WARN retry $n/$max: $*"
    sleep 3
  done
}

echo "[cron] start:
node scripts/guard_deny_md.mjs
 $(date -Is)"

# Always work from autobot branch (self-healing if remote branch was deleted)
git fetch --all --prune

# Self-heal: if autobot diverged from master (manual PRs advanced master), reset autobot to master
if git show-ref --verify --quiet refs/remotes/origin/autobot && \
   git show-ref --verify --quiet refs/remotes/origin/master; then
  if ! git merge-base --is-ancestor "origin/master" "origin/autobot"; then
    echo "[cron] WARN: origin/autobot diverged from origin/master -> resetting autobot to origin/master"
    git checkout -B autobot origin/master
    retry_cmd 5 git push -f origin autobot || { echo "[cron] ERROR: push autobot failed"; exit 1; }
    echo "[cron] origin/autobot reset complete"
  fi
fi

if git show-ref --verify --quiet refs/remotes/origin/autobot; then
  # remote branch exists -> hard reset local to it
  if git rev-parse --verify autobot >/dev/null 2>&1; then
    git checkout autobot
  else
    git checkout -b autobot
  fi
  git reset --hard origin/autobot
else
  # remote branch missing (often deleted after merge) -> recreate from origin/master
  echo "[cron] origin/autobot missing -> recreate autobot from origin/master"
  git checkout -B autobot origin/master
  retry_cmd 5 git push -u origin autobot || { echo "[cron] WARNING: push autobot failed"; exit 0; }
fi

# Optional repo hygiene: disable active tool markdown files when Sheet status
# is NEEDS_REVIEW/ERROR/BLACKLIST. Disabled by default.
if [[ "${REPO_DISABLE_BY_STATUS:-0}" == "1" ]]; then
  echo "[cron] repo-status-disable: audit_repo_disable_by_sheet_status.mjs --apply=1"
  node scripts/audit_repo_disable_by_sheet_status.mjs --apply=1 --json
fi

# 1) Generate (can be disabled for manual fixes)
if [[ "${PUBLISH_ONLY:-0}" == "1" ]]; then
  echo "[cron] PUBLISH_ONLY=1 -> skip generation (no NEW tools will be processed)"
else
  echo "[cron] running QC gate for NEW/IN_PROGRESS before publish"
  QC_OUT="$(node scripts/qc_before_publish.mjs)"
  echo "[cron] qc helper output:"
  printf '%s\n' "$QC_OUT"
  QC_MOVED="$(printf '%s\n' "$QC_OUT" | sed -n 's/^QC_MOVED_TO_NEEDS_REVIEW=//p' | tail -n 1)"
  if ! [[ "$QC_MOVED" =~ ^[0-9]+$ ]]; then
    QC_MOVED=9999
  fi
  echo "[cron] QC_MOVED_TO_NEEDS_REVIEW=$QC_MOVED"
  if [[ "$QC_MOVED" -gt 0 ]]; then
    echo "[cron] QC moved $QC_MOVED rows to NEEDS_REVIEW -> skip publish this run"
    exit 0
  fi
  PUBLISH_BATCH_SIZE="${PUBLISH_BATCH_SIZE:-10}"
  echo "[cron] batch_size=${PUBLISH_BATCH_SIZE}"
  node scripts/test_run_9_full.mjs "${PUBLISH_BATCH_SIZE}"
fi

# 2) Detect changes
CHANGED="$(git status --porcelain || true)"
if [[ -z "$CHANGED" ]]; then
  echo "[cron] no changes -> nothing to commit"
  exit 0
fi

# 3) Allowlist: only content/tools/*.md
BAD="$(printf '%s\n' "$CHANGED" | awk '{print $2}' | grep -vE '^content/tools/[^/]+\.md$' || true)"
if [[ -n "$BAD" ]]; then
  echo "[cron] ERROR: unexpected changed files (refuse to commit/push):"
  echo "$BAD"
  exit 2
fi

git add content/tools/*.md

if git diff --cached --quiet; then
  echo "[cron] staged is empty -> nothing to commit"
  exit 0
fi

MSG="content: autogen tools ($(date -u +%F\ %H:%M\ UTC))"
git -c user.name="utildesk-cron" -c user.email="utildesk-cron@local" commit -m "$MSG"

echo "[cron] finalize deferred sheet statuses (post-commit)"
node scripts/test_run_9_full.mjs --finalize-deferred || echo "[cron] WARNING: deferred finalization failed"

echo "[cron] pushing autobot..."
retry_cmd 5 git push origin autobot || { echo "[cron] WARNING: push autobot failed"; exit 0; }

# 4) PR creation / update + enable auto-merge
# Find open PR via gh pr list (gh pr view does not support --head flag)
PR_NUMBER="$(gh pr list --head autobot --base master --state open --json number --jq '.[0].number' 2>/dev/null || true)"

if [[ -n "$PR_NUMBER" ]]; then
  echo "[cron] open PR found: #${PR_NUMBER} (autobot -> master)"
else
  echo "[cron] no open PR found -> creating PR (autobot -> master)"
  if retry_cmd 5 gh pr create --base master --head autobot \
      --title "Autobot: publish new tools" \
      --body "Automated content publish from Google Sheet."; then
    PR_NUMBER="$(gh pr list --head autobot --base master --state open --json number --jq '.[0].number' 2>/dev/null || true)"
    echo "[cron] PR created: #${PR_NUMBER:-unknown}"
  else
    echo "[cron] WARNING: gh pr create failed"
    # Re-check: PR may already exist (race condition or previous run)
    PR_NUMBER="$(gh pr list --head autobot --base master --state open --json number --jq '.[0].number' 2>/dev/null || true)"
    if [[ -z "$PR_NUMBER" ]]; then
      echo "[cron] WARNING: no open PR and create failed -> cannot merge, skipping"
      exit 0
    fi
    echo "[cron] WARNING: gh pr create failed but PR exists: #${PR_NUMBER} -> continuing to merge"
  fi
fi

# Enable auto-merge (merge commit, safe with protection rules)
# Always runs when PR_NUMBER is known; never blocked by create failures
echo "[cron] enabling auto-merge on PR #${PR_NUMBER:-autobot}..."
retry_cmd 5 gh pr merge --merge --admin --delete-branch=false "${PR_NUMBER:-autobot}" || { echo "[cron] WARNING: gh pr merge failed"; exit 0; }

# 5) Auto-sync autobot -> master (fast-forward only, no merge commit)
echo "[cron] auto-sync autobot -> master (ff-only)"

CURRENT_BRANCH="$(git branch --show-current || true)"
echo "[cron] current branch: ${CURRENT_BRANCH:-unknown}"
if [[ "$CURRENT_BRANCH" != "autobot" ]]; then
  echo "[cron] switching to autobot branch"
  git checkout autobot
fi

HEAD_SHA="$(git rev-parse HEAD)"
echo "[cron] HEAD sha: $HEAD_SHA"

echo "[cron] fetch origin for fresh refs"
git fetch origin

echo "[cron] push origin autobot"
retry_cmd 5 git push origin autobot || { echo "[cron] WARNING: push autobot failed"; exit 0; }

O="$(git rev-parse origin/master)"
A="$(git rev-parse origin/autobot)"
echo "[cron] origin/master sha: $O"
echo "[cron] origin/autobot sha: $A"

if git merge-base --is-ancestor "$O" "$A"; then
  echo "[cron] ancestry check: PASS (origin/master is ancestor of origin/autobot)"
  echo "[cron] fast-forward push: origin autobot:master"
  retry_cmd 5 git push origin autobot:master || { echo "[cron] WARNING: ff push to master failed"; exit 0; }
else
  echo "[cron] WARNING: ancestry check FAIL (origin/master is not ancestor of origin/autobot)"
  echo "[cron] skip pushing master to avoid non-fast-forward update"
fi

# 6) Post-publish advisory: scan DONE rows for suspicious URLs
#    Dry-run only — does NOT change statuses. Set POST_PUBLISH_URL_AUDIT=1 to enable.
if [[ "${POST_PUBLISH_URL_AUDIT:-0}" == "1" ]]; then
  echo "[cron] post-publish: audit_done_suspicious_official_url.mjs (dry-run)"
  DONE_AUDIT_OUT="$(node scripts/audit_done_suspicious_official_url.mjs --json 2>/dev/null || true)"
  DONE_FLAGGED="$(printf '%s\n' "$DONE_AUDIT_OUT" | grep -oP '"flagged_count":\s*\K\d+' | head -1 || echo '?')"
  DONE_CHECKED="$(printf '%s\n' "$DONE_AUDIT_OUT" | grep -oP '"total_done_checked":\s*\K\d+' | head -1 || echo '?')"
  echo "[cron] done-url-audit: checked=${DONE_CHECKED} flagged=${DONE_FLAGGED}"
  if [[ "${DONE_FLAGGED:-0}" != "0" && "${DONE_FLAGGED:-?}" != "?" ]]; then
    echo "[cron] WARN: ${DONE_FLAGGED} DONE rows have suspicious official_url -> run audit_done_suspicious_official_url.mjs --apply=1 manually"
  fi
fi

echo "[cron] done: $(date -Is)"
