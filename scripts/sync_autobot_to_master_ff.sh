#!/usr/bin/env bash
set -euo pipefail

REMOTE="${1:-origin}"
SRC_BRANCH="${2:-autobot}"
DST_BRANCH="${3:-master}"

log() {
  printf '[sync-autobot-master] %s
' "$*"
}

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

git fetch "$REMOTE" >/dev/null 2>&1 || true

if ! git show-ref --verify --quiet "refs/remotes/${REMOTE}/${SRC_BRANCH}"; then
  log "missing remote branch ${REMOTE}/${SRC_BRANCH} -> skip"
  exit 0
fi

if ! git show-ref --verify --quiet "refs/remotes/${REMOTE}/${DST_BRANCH}"; then
  log "missing remote branch ${REMOTE}/${DST_BRANCH} -> skip"
  exit 0
fi

SRC_SHA="$(git rev-parse "${REMOTE}/${SRC_BRANCH}")"
DST_SHA="$(git rev-parse "${REMOTE}/${DST_BRANCH}")"
log "remote=${REMOTE} src=${SRC_BRANCH}@${SRC_SHA} dst=${DST_BRANCH}@${DST_SHA}"

if [[ "$SRC_SHA" == "$DST_SHA" ]]; then
  log "already synced"
  exit 0
fi

if git merge-base --is-ancestor "${REMOTE}/${DST_BRANCH}" "${REMOTE}/${SRC_BRANCH}"; then
  log "fast-forward push ${SRC_BRANCH}:${DST_BRANCH}"
  git push "$REMOTE" "refs/remotes/${REMOTE}/${SRC_BRANCH}:refs/heads/${DST_BRANCH}"
  log "sync complete"
  exit 0
fi

log "skip: ${REMOTE}/${DST_BRANCH} is not ancestor of ${REMOTE}/${SRC_BRANCH}"
exit 0
