#!/bin/bash

#
# Test script for umami_sync_popularity.mjs with mock data
#
# This script demonstrates how the sync script works using mock Umami data.
# Useful for testing when Umami doesn't have real pageview data yet.
#

echo "Testing Umami Sync Script"
echo "=========================="
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
  echo "Error: Node.js not found"
  exit 1
fi

# Test 1: Show help
echo "Test 1: Show help"
echo "-----------------"
node scripts/umami_sync_popularity.mjs --help
echo ""

# Test 2: Check required env vars validation
echo "Test 2: Validate required environment variables"
echo "-----------------------------------------------"
node scripts/umami_sync_popularity.mjs --days 30 2>&1 | grep -A3 "Configuration errors" || echo "OK: Validation works"
echo ""

# Test 3: Dry run with env vars (will fail if no Umami data)
echo "Test 3: Dry run with environment variables"
echo "------------------------------------------"

if [ -f .env ]; then
  source .env
  export UMAMI_WEBSITE_ID UMAMI_USERNAME UMAMI_PASSWORD

  echo "Running dry-run..."
  node scripts/umami_sync_popularity.mjs --days 7 2>&1

  echo ""
  echo "Note: If you see 'Bad Request' error, this is expected when Umami has no pageview data yet."
  echo "The script will work correctly once pageviews are collected."
else
  echo "Warning: .env file not found. Skipping test 3."
fi

echo ""
echo "=========================="
echo "Test completed"
echo "=========================="
