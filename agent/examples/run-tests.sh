#!/bin/bash
# Example: Auto-fix until tests pass

cd "$(dirname "$0")/../.."

node agent/cli.mjs \
  --task "Make all tests pass" \
  --check "npm test" \
  --branch agent/test-fixes \
  --max-iterations 10
