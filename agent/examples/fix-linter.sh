#!/bin/bash
# Example: Auto-fix linter errors

cd "$(dirname "$0")/../.."

node agent/cli.mjs \
  --task "Fix ESLint errors" \
  --check "npm run lint" \
  --branch agent/eslint-fixes \
  --max-iterations 3
