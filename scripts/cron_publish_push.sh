#!/usr/bin/env bash
set -euo pipefail

cd /opt/utildesk-motia

echo "[cron] start: $(date -Is)"

# Always work from autobot branch
git fetch --all --prune

if ! git rev-parse --verify autobot >/dev/null 2>&1; then
  git checkout -b autobot
else
  git checkout autobot
fi

# sync with remote
git reset --hard origin/autobot

# 1) Generate
node scripts/test_run_9_full.mjs 3

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

echo "[cron] pushing autobot..."
git push

# 4) PR creation / update + enable auto-merge
# PR title is stable; body is minimal (avoid noise)
if gh pr view --head autobot --json number >/dev/null 2>&1; then
  echo "[cron] PR already exists (autobot -> master)"
else
  echo "[cron] creating PR (autobot -> master)"
  gh pr create --base master --head autobot --title "Autobot: publish new tools" --body "Automated content publish from Google Sheet."
fi

# Enable auto-merge (merge commit, safe with protection rules)
echo "[cron] enabling auto-merge..."
gh pr merge --auto --merge --delete-branch=false autobot || true

echo "[cron] done: $(date -Is)"
