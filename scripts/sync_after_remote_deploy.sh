#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bash scripts/sync_after_remote_deploy.sh [options]

Synchronizes an Ubuntu checkout after production was deployed elsewhere.

Options:
  --repo PATH                 Repository path. Default: current directory.
  --remote NAME               Production Git remote. Default: origin.
  --branch NAME               Production branch. Default: master.
  --production-worktree PATH  Clean memory mirror. Default: ~/projects/utildesk-motia-production-sync.
  --sync-hub                  Mirror origin production refs to the hub remote.
  --skip-main-fast-forward    Do not fast-forward the main checkout.
  --no-production-worktree    Do not create/update the clean production mirror.
  -h, --help                  Show this help.
EOF
}

REPO="${REPO:-$(pwd)}"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-master}"
PRODUCTION_WORKTREE="${PRODUCTION_WORKTREE:-$HOME/projects/utildesk-motia-production-sync}"
SYNC_HUB=0
SKIP_MAIN_FAST_FORWARD=0
NO_PRODUCTION_WORKTREE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO="$2"
      shift 2
      ;;
    --remote)
      REMOTE="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --production-worktree)
      PRODUCTION_WORKTREE="$2"
      shift 2
      ;;
    --sync-hub)
      SYNC_HUB=1
      shift
      ;;
    --skip-main-fast-forward)
      SKIP_MAIN_FAST_FORWARD=1
      shift
      ;;
    --no-production-worktree)
      NO_PRODUCTION_WORKTREE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

git_out() {
  git -C "$1" "${@:2}"
}

remote_exists() {
  git -C "$1" remote get-url "$2" >/dev/null 2>&1
}

warn() {
  echo "WARNING: $*" >&2
}

REPO_ROOT="$(git -C "$REPO" rev-parse --show-toplevel)"
echo "[sync] repo: $REPO_ROOT"

git_out "$REPO_ROOT" fetch "$REMOTE" "$BRANCH" autobot

REMOTE_MASTER_REF="refs/remotes/$REMOTE/$BRANCH"
REMOTE_AUTOBOT_REF="refs/remotes/$REMOTE/autobot"
REMOTE_MASTER_SHA="$(git_out "$REPO_ROOT" rev-parse "$REMOTE_MASTER_REF")"
REMOTE_AUTOBOT_SHA="$(git_out "$REPO_ROOT" rev-parse "$REMOTE_AUTOBOT_REF")"

if [[ "$REMOTE_MASTER_SHA" != "$REMOTE_AUTOBOT_SHA" ]]; then
  echo "ERROR: $REMOTE/$BRANCH and $REMOTE/autobot are not aligned: $REMOTE_MASTER_SHA vs $REMOTE_AUTOBOT_SHA" >&2
  exit 1
fi

echo "[sync] production head: ${REMOTE_MASTER_SHA:0:7}"

if [[ "$SYNC_HUB" -eq 1 ]] && remote_exists "$REPO_ROOT" hub; then
  git_out "$REPO_ROOT" push hub \
    "${REMOTE_MASTER_REF}:refs/heads/$BRANCH" \
    "${REMOTE_AUTOBOT_REF}:refs/heads/autobot"
  echo "[sync] hub master/autobot mirrored"
fi

if [[ "$SKIP_MAIN_FAST_FORWARD" -eq 0 ]]; then
  MAIN_STATUS="$(git_out "$REPO_ROOT" status --porcelain)"
  if [[ -z "$MAIN_STATUS" ]]; then
    LOCAL_HEAD="$(git_out "$REPO_ROOT" rev-parse HEAD)"
    BASE="$(git_out "$REPO_ROOT" merge-base HEAD "$REMOTE_MASTER_REF")"
    if [[ "$LOCAL_HEAD" == "$REMOTE_MASTER_SHA" ]]; then
      echo "[sync] main checkout already at production head"
    elif [[ "$BASE" == "$LOCAL_HEAD" ]]; then
      git_out "$REPO_ROOT" pull --ff-only "$REMOTE" "$BRANCH"
      echo "[sync] main checkout fast-forwarded"
    else
      warn "[sync] main checkout is clean but not a fast-forward candidate; left untouched"
    fi
  else
    warn "[sync] main checkout is dirty; left untouched"
    printf '%s\n' "$MAIN_STATUS"
  fi
fi

if [[ "$NO_PRODUCTION_WORKTREE" -eq 0 ]]; then
  if [[ -d "$PRODUCTION_WORKTREE/.git" || -f "$PRODUCTION_WORKTREE/.git" ]]; then
    SYNC_STATUS="$(git_out "$PRODUCTION_WORKTREE" status --porcelain)"
    if [[ -n "$SYNC_STATUS" ]]; then
      echo "ERROR: Production sync worktree is dirty: $PRODUCTION_WORKTREE" >&2
      printf '%s\n' "$SYNC_STATUS" >&2
      exit 1
    fi
    git_out "$PRODUCTION_WORKTREE" fetch "$REMOTE" "$BRANCH" autobot
    git_out "$PRODUCTION_WORKTREE" reset --hard "$REMOTE_MASTER_REF"
  else
    mkdir -p "$(dirname "$PRODUCTION_WORKTREE")"
    git_out "$REPO_ROOT" worktree add -B codex/production-sync "$PRODUCTION_WORKTREE" "$REMOTE/$BRANCH"
  fi

  SYNC_HEAD="$(git_out "$PRODUCTION_WORKTREE" rev-parse HEAD)"
  if [[ "$SYNC_HEAD" != "$REMOTE_MASTER_SHA" ]]; then
    echo "ERROR: Production sync worktree did not reach ${REMOTE_MASTER_SHA:0:7}" >&2
    exit 1
  fi
  echo "[sync] production memory mirror: $PRODUCTION_WORKTREE"
  echo "[sync] memory files to read after remote deploy:"
  echo "  $PRODUCTION_WORKTREE/memory/recent_changes.md"
  echo "  $PRODUCTION_WORKTREE/HANDOFF.md"
  echo "  $PRODUCTION_WORKTREE/memory/decisions.md"
fi

echo "[sync] complete"
