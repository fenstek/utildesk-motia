#!/usr/bin/env bash
set -euo pipefail

cd /opt/utildesk-motia

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

# 1) Generate (can be disabled for manual fixes)
if [[ "${PUBLISH_ONLY:-0}" == "1" ]]; then
  echo "[cron] PUBLISH_ONLY=1 -> skip generation (no NEW tools will be processed)"
else
  node scripts/test_run_9_full.mjs 3
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
# PR title is stable; body is minimal (avoid noise)
if gh pr view --head autobot --json number >/dev/null 2>&1; then
  echo "[cron] PR already exists (autobot -> master)"
else
  echo "[cron] creating PR (autobot -> master)"
  retry_cmd 5 gh pr create --base master --head autobot --title "Autobot: publish new tools" --body "Automated content publish from Google Sheet." || { echo "[cron] WARNING: gh pr create failed"; exit 0; }
fi

# Enable auto-merge (merge commit, safe with protection rules)
echo "[cron] enabling auto-merge..."
retry_cmd 5 gh pr merge --merge --admin --delete-branch=false autobot || { echo "[cron] WARNING: gh pr merge failed"; exit 0; }

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

echo "[cron] done: $(date -Is)"
