#!/bin/bash

#
# Umami Popularity Sync - Cron Helper
#
# Автоматическая синхронизация популярности инструментов из Umami в frontmatter.
# Предназначен для запуска через cron.
#
# Crontab example (ежедневно в 03:15 UTC):
#   15 3 * * * cd /opt/utildesk-motia && bash scripts/cron_umami_popularity.sh >> /var/log/umami-sync.log 2>&1
#
# Или каждые 6 часов:
#   15 */6 * * * cd /opt/utildesk-motia && bash scripts/cron_umami_popularity.sh >> /var/log/umami-sync.log 2>&1
#

set -e  # Exit on error

# Configuration
REPO_DIR="/opt/utildesk-motia"
SCRIPT="scripts/umami_sync_popularity.mjs"
DAYS="${UMAMI_SYNC_DAYS:-30}"
MAX_UPDATES="${UMAMI_SYNC_MAX_UPDATES:-500}"
ZERO_MISSING="${UMAMI_SYNC_ZERO_MISSING:-yes}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Umami Popularity Sync"
echo "$(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "=========================================="

# Change to repo directory
cd "$REPO_DIR" || {
  echo -e "${RED}Error: Cannot change to $REPO_DIR${NC}"
  exit 1
}

# Load environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  set -a
  source .env
  set +a
else
  echo -e "${YELLOW}Warning: .env file not found${NC}"
fi

# Validate required environment variables
if [ -z "$UMAMI_WEBSITE_ID" ] || [ -z "$UMAMI_USERNAME" ] || [ -z "$UMAMI_PASSWORD" ]; then
  echo -e "${RED}Error: Required environment variables not set${NC}"
  echo "Please ensure .env contains:"
  echo "  UMAMI_WEBSITE_ID"
  echo "  UMAMI_USERNAME"
  echo "  UMAMI_PASSWORD"
  exit 1
fi

# Build command arguments
ARGS="--days $DAYS --apply --max-updates $MAX_UPDATES"

if [ "$ZERO_MISSING" = "yes" ]; then
  ARGS="$ARGS --zero-missing"
fi

# Run sync script
echo ""
echo "Running: node $SCRIPT $ARGS"
echo ""

if node "$SCRIPT" $ARGS; then
  echo ""
  echo -e "${GREEN}✓ Sync completed successfully${NC}"

  # Check if there are any changes
  if git diff --quiet content/tools/*.md 2>/dev/null; then
    echo "No changes detected. Nothing to commit."
    exit 0
  fi

  # Show summary of changes
  echo ""
  echo "Changes detected:"
  git diff --stat content/tools/*.md

  # Commit and push changes
  echo ""
  echo "Committing changes..."

  git add content/tools/*.md

  if git commit -m "chore: sync popularity from Umami ($(date '+%Y-%m-%d'))" --quiet; then
    echo -e "${GREEN}✓ Changes committed${NC}"

    # Push to remote
    echo "Pushing to origin/master..."
    if git push origin master --quiet; then
      echo -e "${GREEN}✓ Changes pushed successfully${NC}"
    else
      echo -e "${RED}✗ Failed to push changes${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}⚠ No changes to commit (git commit returned empty)${NC}"
  fi

else
  echo ""
  echo -e "${RED}✗ Sync failed${NC}"
  exit 1
fi

echo ""
echo "=========================================="
echo "Completed: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "=========================================="
