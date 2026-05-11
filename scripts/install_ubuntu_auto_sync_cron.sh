#!/usr/bin/env bash
set -euo pipefail

INTERVAL_MINUTES="${INTERVAL_MINUTES:-5}"
REPO="${UTILDESK_REPO:-$HOME/projects/utildesk-motia-worker}"
RUNNER="$REPO/scripts/run_ubuntu_auto_sync.sh"
MARKER_START="# >>> utildesk-motia auto-sync (managed)"
MARKER_END="# <<< utildesk-motia auto-sync (managed)"

if ! command -v crontab >/dev/null 2>&1; then
  echo "ERROR: crontab is not available on this Ubuntu host." >&2
  exit 1
fi

if [[ ! -f "$RUNNER" ]]; then
  echo "ERROR: auto-sync runner not found: $RUNNER" >&2
  exit 1
fi

mkdir -p "$HOME/utildesk-chatgpt-worker/logs"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

crontab -l 2>/dev/null \
  | awk -v start="$MARKER_START" -v end="$MARKER_END" '
      $0 == start { skip=1; next }
      $0 == end { skip=0; next }
      !skip { print }
    ' > "$tmp" || true

{
  printf '%s\n' "$MARKER_START"
  printf '*/%s * * * * /bin/bash -lc '\''cd "$HOME/projects/utildesk-motia-worker" && bash scripts/run_ubuntu_auto_sync.sh'\''\n' "$INTERVAL_MINUTES"
  printf '%s\n' "$MARKER_END"
} >> "$tmp"

crontab "$tmp"

echo "CRON_INSTALLED=utildesk-motia-auto-sync"
echo "INTERVAL_MINUTES=$INTERVAL_MINUTES"
echo "RUNNER=$RUNNER"
