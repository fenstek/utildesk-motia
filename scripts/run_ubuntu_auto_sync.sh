#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${UTILDESK_ENV_FILE:-$HOME/utildesk-chatgpt-worker/env.sh}"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

REPO="${UTILDESK_REPO:-$HOME/projects/utildesk-motia-worker}"
LOG_DIR="${UTILDESK_AUTO_SYNC_LOG_DIR:-$HOME/utildesk-chatgpt-worker/logs}"
LOCK_FILE="${UTILDESK_AUTO_SYNC_LOCK:-/tmp/utildesk-motia-auto-sync.lock}"
LOG_FILE="$LOG_DIR/auto-sync.log"

mkdir -p "$LOG_DIR"

{
  printf '[%s] start: ubuntu auto-sync\n' "$(date -Is)"

  if command -v flock >/dev/null 2>&1; then
    exec 9>"$LOCK_FILE"
    if ! flock -n 9; then
      printf '[%s] skip: another auto-sync is already running\n' "$(date -Is)"
      exit 0
    fi
  fi

  cd "$REPO"
  bash scripts/sync_after_remote_deploy.sh --repo "$REPO" --sync-hub
  printf '[%s] complete: ubuntu auto-sync\n' "$(date -Is)"
} >> "$LOG_FILE" 2>&1
