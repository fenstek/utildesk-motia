# Verification Engineer Agent

Purpose: create a backup point, run a self-healing loop, and verify disabled tools are not present in published artifacts.

Run:
```bash
node agent/cli.mjs
```

Environment variables:
- `CHECK_DISABLED_SLUGS` (default: `kreator,suno`)
- `SITEMAP_PATH` (default: `site/public/sitemap.xml`)
- `DIST_DIRS` (default: `site/dist,dist`)
- `MAX_ITERS` (default: `5`)
- `CODEX_BIN` (default: `codex`)
- `CODEX_MODE` (default: `exec`)
- `CODEX_PROMPT` (default below)
- `BACKUP_EACH_ITER` (default: `0`)

Default prompt:
```
Fix the project so disabled:true tools are not shown in catalog/index/pages and are not generated; do not break the pipeline.
```

Backup rollback:
- On start, the agent creates a git tag and prints a rollback command:
  `git reset --hard <tag>`

Notes:
- Checks run against existing artifacts only. Build is not executed.
- Dist checks are skipped if `site/dist` or `dist` do not exist.
