#!/usr/bin/env bash
set -euo pipefail

cd /opt/utildesk-motia

echo "[cron] start: $(date -Is)"

# 1) Генерация (дирижёр)
node scripts/test_run_9_full.mjs 3

# 2) Проверка изменений
CHANGED="$(git status --porcelain || true)"
if [[ -z "$CHANGED" ]]; then
  echo "[cron] no changes -> nothing to commit"
  exit 0
fi

# 3) Allowlist: коммитим только content/tools/*.md
BAD="$(printf '%s\n' "$CHANGED" | awk '{print $2}' | grep -vE '^content/tools/[^/]+\.md$' || true)"
if [[ -n "$BAD" ]]; then
  echo "[cron] ERROR: unexpected changed files (refuse to commit/push):"
  echo "$BAD"
  exit 2
fi

# 4) Commit + push
git add content/tools/*.md

# защита от "nothing to commit" после add
if git diff --cached --quiet; then
  echo "[cron] staged is empty -> nothing to commit"
  exit 0
fi

MSG="content: autogen tools ($(date -u +%F\ %H:%M\ UTC))"
git -c user.name="utildesk-cron" -c user.email="utildesk-cron@local" commit -m "$MSG"

echo "[cron] pushing..."
git push

echo "[cron] done: $(date -Is)"
