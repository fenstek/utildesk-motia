#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bash scripts/deploy_from_ubuntu.sh [options]

Publishes the current clean, already-committed HEAD from the Ubuntu worker.

Options:
  --repo PATH          Repository path. Default: current directory.
  --remote NAME        Production Git remote. Default: origin.
  --branch NAME        Production branch. Default: master.
  --hub-remote NAME    Exchange remote. Default: hub.
  --hub-only           Do not push production; push a pending branch to hub.
  --skip-build         Skip editorial checks and Astro build.
  --skip-indexnow      Skip post-deploy IndexNow notification.
  --no-hub-sync        Do not mirror successful production deploy to hub.
  --dry-run            Run preflight/checks without pushing.
  -h, --help           Show this help.

Required release discipline:
  - The worktree must be clean.
  - HEAD must be based on current origin/master.
  - Content/scripts/docs releases must include tracked memory or handoff notes.
EOF
}

REPO="${REPO:-$(pwd)}"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-master}"
HUB_REMOTE="${HUB_REMOTE:-hub}"
RUN_BUILD=1
RUN_INDEXNOW=1
SYNC_HUB=1
HUB_ONLY=0
DRY_RUN=0

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
    --hub-remote)
      HUB_REMOTE="$2"
      shift 2
      ;;
    --hub-only)
      HUB_ONLY=1
      shift
      ;;
    --skip-build)
      RUN_BUILD=0
      shift
      ;;
    --skip-indexnow)
      RUN_INDEXNOW=0
      shift
      ;;
    --no-hub-sync)
      SYNC_HUB=0
      shift
      ;;
    --dry-run)
      DRY_RUN=1
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

cd "$REPO"
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

remote_exists() {
  git remote get-url "$1" >/dev/null 2>&1
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

warn() {
  echo "WARNING: $*" >&2
}

echo "[deploy] repo: $REPO_ROOT"
echo "[deploy] remote: $REMOTE branch: $BRANCH"

if [[ -n "$(git status --porcelain)" ]]; then
  git status --short
  die "Worktree is dirty. Commit content plus memory/handoff first."
fi

git fetch "$REMOTE" "$BRANCH" autobot
REMOTE_MASTER="$REMOTE/$BRANCH"

if ! git rev-parse --verify "$REMOTE_MASTER" >/dev/null 2>&1; then
  die "Cannot resolve $REMOTE_MASTER"
fi

if ! git merge-base --is-ancestor "$REMOTE_MASTER" HEAD; then
  echo "[deploy] HEAD:          $(git rev-parse --short HEAD)"
  echo "[deploy] $REMOTE_MASTER: $(git rev-parse --short "$REMOTE_MASTER")"
  die "HEAD is not based on $REMOTE_MASTER. Fetch/rebase before deploying."
fi

RANGE="$REMOTE_MASTER..HEAD"
CHANGED_FILES="$(git diff --name-only "$RANGE" || true)"

if [[ -n "$CHANGED_FILES" ]]; then
  echo "[deploy] changed files since $REMOTE_MASTER:"
  echo "$CHANGED_FILES" | sed 's/^/  - /'

  if echo "$CHANGED_FILES" | grep -Eq '^(content/|scripts/|site/|docs/04_operations/)'; then
    if ! echo "$CHANGED_FILES" | grep -Eq '^(memory/recent_changes\.md|memory/decisions\.md|HANDOFF\.md)'; then
      die "Release touches production-relevant files but has no memory/recent_changes.md, memory/decisions.md, or HANDOFF.md update."
    fi
  fi
else
  echo "[deploy] no commits ahead of $REMOTE_MASTER"
fi

git diff --check "$RANGE"

if [[ "$RUN_BUILD" -eq 1 ]]; then
  if [[ -f package.json ]]; then
    npm run check:editorial
  fi

  if [[ -f scripts/check_english_tool_translations.mjs ]]; then
    node scripts/check_english_tool_translations.mjs
  fi

  if [[ -f site/package.json ]]; then
    if [[ -f site/package-lock.json && ! -x site/node_modules/.bin/astro ]]; then
      npm --prefix site ci
    fi
    npm --prefix site run build
    for generated in site/src/data/content-lastmod.json site/src/data/tool-added-at.json; do
      if [[ -e "$generated" ]]; then
        git restore -- "$generated" || true
      fi
    done
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    git status --short
    die "Checks/build left the worktree dirty."
  fi
fi

HEAD_SHA="$(git rev-parse HEAD)"
HEAD_SHORT="$(git rev-parse --short HEAD)"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[deploy] dry run complete; would publish $HEAD_SHORT"
  exit 0
fi

if [[ "$HUB_ONLY" -eq 1 ]]; then
  remote_exists "$HUB_REMOTE" || die "Hub remote '$HUB_REMOTE' is not configured."
  STAMP="$(date -u +%Y%m%d%H%M%S)"
  PENDING_REF="codex/pending-ubuntu-deploy-$STAMP"
  git push "$HUB_REMOTE" "HEAD:refs/heads/$PENDING_REF"
  echo "[deploy] pushed pending hub ref: $PENDING_REF"
  echo "[deploy] finalize from Windows:"
  echo "  powershell -ExecutionPolicy Bypass -File scripts/publish_hub_ref_from_windows.ps1 -HubRef $PENDING_REF"
  exit 0
fi

if ! git push "$REMOTE" "HEAD:$BRANCH"; then
  if remote_exists "$HUB_REMOTE"; then
    STAMP="$(date -u +%Y%m%d%H%M%S)"
    PENDING_REF="codex/pending-ubuntu-deploy-$STAMP"
    git push "$HUB_REMOTE" "HEAD:refs/heads/$PENDING_REF" || true
    warn "Production push failed; pushed pending hub ref '$PENDING_REF' for laptop finalization."
    warn "Windows command: powershell -ExecutionPolicy Bypass -File scripts/publish_hub_ref_from_windows.ps1 -HubRef $PENDING_REF"
  fi
  die "Production push to $REMOTE failed."
fi

git push "$REMOTE" "HEAD:autobot"

REMOTE_MASTER_SHA="$(git ls-remote "$REMOTE" "refs/heads/$BRANCH" | awk '{print $1}')"
REMOTE_AUTOBOT_SHA="$(git ls-remote "$REMOTE" refs/heads/autobot | awk '{print $1}')"

if [[ "$REMOTE_MASTER_SHA" != "$HEAD_SHA" || "$REMOTE_AUTOBOT_SHA" != "$HEAD_SHA" ]]; then
  die "Remote refs are not aligned after push."
fi

echo "[deploy] production refs aligned at $HEAD_SHORT"

if [[ "$SYNC_HUB" -eq 1 ]] && remote_exists "$HUB_REMOTE"; then
  git push "$HUB_REMOTE" "HEAD:$BRANCH" "HEAD:autobot" || warn "Could not mirror production refs to $HUB_REMOTE."
fi

if [[ "$RUN_INDEXNOW" -eq 1 && -f scripts/indexnow_submit.py && -n "$CHANGED_FILES" ]]; then
  if ! python scripts/indexnow_submit.py submit-git-range --rev-range "$RANGE" --wait-live; then
    warn "IndexNow submit failed after deploy; production push is already complete."
  fi
fi

echo "[deploy] complete: $HEAD_SHORT"
