#!/bin/bash
# Example: Auto-fix validation errors in sheet_ai_autogen script

cd "$(dirname "$0")/../.."

node agent/cli.mjs \
  --task "Fix AI tools validation errors" \
  --check "node scripts/sheet_ai_autogen_9_strict_v2.mjs 10 --dry-run --json" \
  --branch agent/validation-fixes \
  --max-iterations 5 \
  --verbose
