#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PRE_HOOK_PATH="${ROOT}/.git/hooks/pre-push"
POST_HOOK_PATH="${ROOT}/.git/hooks/post-push"

cat > "$PRE_HOOK_PATH" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail

[[ "${UTILDESK_ALLOW_DIRECT_AUTOBOT_PUSH:-0}" == "1" ]] && exit 0

REMOTE_NAME="${1:-origin}"
[[ "${REMOTE_NAME}" == "origin" ]] || exit 0

while read -r local_ref local_sha remote_ref remote_sha; do
  if [[ "${remote_ref}" == "refs/heads/autobot" ]]; then
    echo "[pre-push] Direct push to origin/autobot is blocked to prevent preview-only deploy drift." >&2
    echo "[pre-push] Use ./scripts/push_autobot_prod.sh so master is fast-forward synced as well." >&2
    exit 1
  fi
done
HOOK

chmod +x "$PRE_HOOK_PATH"
rm -f "$POST_HOOK_PATH"

git config alias.push-autobot-prod '!bash scripts/push_autobot_prod.sh'

echo "HOOK_INSTALLED=$PRE_HOOK_PATH"
echo "GIT_ALIAS=push-autobot-prod"
