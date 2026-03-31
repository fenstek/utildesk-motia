#!/bin/bash

#
# Umami Popularity Sync - Cron Helper
#
# Synchronizes tool popularity from Umami into frontmatter.
# Intended for cron execution.
#
# Crontab example (daily at 03:15 UTC):
#   15 3 * * * cd /opt/utildesk-motia && bash scripts/cron_umami_popularity.sh >> /var/log/umami-sync.log 2>&1
#
# Or every 6 hours:
#   15 */6 * * * cd /opt/utildesk-motia && bash scripts/cron_umami_popularity.sh >> /var/log/umami-sync.log 2>&1
#

set -e

REPO_DIR="/opt/utildesk-motia"
SCRIPT="scripts/umami_sync_popularity.mjs"
DAYS="${UMAMI_SYNC_DAYS:-30}"
MAX_UPDATES="${UMAMI_SYNC_MAX_UPDATES:-500}"
ZERO_MISSING="${UMAMI_SYNC_ZERO_MISSING:-yes}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Umami Popularity Sync"
echo "$(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "=========================================="

cd "$REPO_DIR" || {
  echo -e "${RED}Error: Cannot change to $REPO_DIR${NC}"
  exit 1
}

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"
TARGET_BRANCH="${UMAMI_SYNC_TARGET_BRANCH:-${CURRENT_BRANCH:-autobot}}"

echo "Current branch: ${CURRENT_BRANCH:-unknown}"
echo "Target branch: ${TARGET_BRANCH}"

echo "Fetching origin..."
git fetch origin --prune --quiet

if git show-ref --verify --quiet "refs/remotes/origin/${TARGET_BRANCH}"; then
  echo "Fast-forwarding from origin/${TARGET_BRANCH}..."
  git merge --ff-only "origin/${TARGET_BRANCH}" >/dev/null
fi

UNTRACKED_CONTENT="$(git ls-files --others --exclude-standard -- content/tools 2>/dev/null || true)"
if [ -n "$UNTRACKED_CONTENT" ]; then
  echo -e "${YELLOW}Warning: untracked content/tools files detected. Refusing Umami sync to avoid mixing unrelated publish artifacts.${NC}"
  printf '%s\n' "$UNTRACKED_CONTENT"
  exit 1
fi

if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  set -a
  source .env
  set +a
else
  echo -e "${YELLOW}Warning: .env file not found${NC}"
fi

if [ -z "$UMAMI_WEBSITE_ID" ] || [ -z "$UMAMI_USERNAME" ] || [ -z "$UMAMI_PASSWORD" ]; then
  echo -e "${RED}Error: Required environment variables not set${NC}"
  echo "Please ensure .env contains:"
  echo "  UMAMI_WEBSITE_ID"
  echo "  UMAMI_USERNAME"
  echo "  UMAMI_PASSWORD"
  exit 1
fi

ARGS="--days $DAYS --apply --max-updates $MAX_UPDATES"
if [ "$ZERO_MISSING" = "yes" ]; then
  ARGS="$ARGS --zero-missing"
fi

echo ""
echo "Running: node $SCRIPT $ARGS"
echo ""

if node "$SCRIPT" $ARGS; then
  echo ""
  echo -e "${GREEN}Sync completed successfully${NC}"

  if git diff --quiet -- content/tools 2>/dev/null; then
    echo "No tracked changes detected. Nothing to commit."
    exit 0
  fi

  echo ""
  echo "Changes detected:"
  git diff --stat -- content/tools

  echo ""
  echo "Committing changes..."

  git add -u content/tools

  if git commit -m "chore: sync popularity from Umami ($(date '+%Y-%m-%d'))" --quiet; then
    echo -e "${GREEN}Changes committed${NC}"

    echo "Pushing via wrapper..."
    if [ "${TARGET_BRANCH}" = "autobot" ]; then
      if ./scripts/push_autobot_prod.sh origin autobot master HEAD; then
        echo -e "${GREEN}Changes pushed successfully${NC}"
      else
        echo -e "${RED}Failed to push changes${NC}"
        exit 1
      fi
    else
      if git push origin "HEAD:${TARGET_BRANCH}" --quiet; then
        echo -e "${GREEN}Changes pushed successfully${NC}"
      else
        echo -e "${RED}Failed to push changes${NC}"
        exit 1
      fi
    fi
  else
    echo -e "${YELLOW}No changes to commit (git commit returned empty)${NC}"
  fi
else
  echo ""
  echo -e "${RED}Sync failed${NC}"
  exit 1
fi

echo ""
echo "=========================================="
echo "Completed: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "=========================================="
