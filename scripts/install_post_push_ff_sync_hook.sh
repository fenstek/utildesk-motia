#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
HOOK_PATH="${ROOT}/.git/hooks/post-push"

cat > "$HOOK_PATH" <<HOOK
#!/usr/bin/env bash
set -euo pipefail

[[ "\${UTILDESK_SKIP_POST_PUSH_SYNC:-0}" == "1" ]] && exit 0

REMOTE_NAME="\${1:-origin}"
REPO_ROOT="/opt/utildesk-motia"
SYNC_SCRIPT="\${REPO_ROOT}/scripts/sync_autobot_to_master_ff.sh"

[[ -x "\${SYNC_SCRIPT}" ]] || exit 0
[[ "\${REMOTE_NAME}" == "origin" ]] || exit 0

while read -r local_ref local_sha remote_ref remote_sha; do
  if [[ "\${remote_ref}" == "refs/heads/autobot" ]]; then
    "\${SYNC_SCRIPT}" "\${REMOTE_NAME}" autobot master || true
    break
  fi
done
HOOK

chmod +x "$HOOK_PATH"
echo "HOOK_INSTALLED=$HOOK_PATH"
