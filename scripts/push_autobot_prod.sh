#!/usr/bin/env bash
set -euo pipefail

REMOTE="${1:-origin}"
AUTOBOT_BRANCH="${2:-autobot}"
MASTER_BRANCH="${3:-master}"
SRC_REF="${4:-HEAD}"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

printf '[push-autobot-prod] push %s -> %s/%s
' "$SRC_REF" "$REMOTE" "$AUTOBOT_BRANCH"
UTILDESK_ALLOW_DIRECT_AUTOBOT_PUSH=1 git push "$REMOTE" "${SRC_REF}:${AUTOBOT_BRANCH}"
"${ROOT}/scripts/sync_autobot_to_master_ff.sh" "$REMOTE" "$AUTOBOT_BRANCH" "$MASTER_BRANCH"
