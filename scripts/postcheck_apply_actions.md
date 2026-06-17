# postcheck_apply_actions.mjs

Applies remediation actions based on the JSON output from `postcheck_scan_suspicious.mjs`.

**DRY-RUN by default.** Pass `--apply` to execute real changes.

## Purpose

Takes the candidate list from the scanner and:

1. Updates the Google Sheet status to `BLACKLIST` or `NEEDS_REVIEW`
2. Deletes `content/tools/<slug>.md` for `BLACKLIST` entries
3. Creates a git commit, pushes to `autobot`, and opens a PR → `master`

This script is intentionally separate from the scanner: the output of a scan can be reviewed by a human before being applied.

## CLI options

| Option | Default | Description |
|--------|---------|-------------|
| `--from <path>` | _(required)_ | Path to JSON file from the scanner |
| `--apply` | off | Execute real changes (absent = dry-run) |
| `--max-delete <n>` | `2` | Max BLACKLIST deletions per run |
| `--max-total <n>` | `10` | Max total candidates processed |
| `--only-status <s>` | _(all)_ | Filter: `BLACKLIST` or `NEEDS_REVIEW` |
| `--no-pr` | off | Skip PR creation (commit+push only) |
| `--pr-title "<text>"` | `"chore: post-check cleanup"` | Custom PR title |

## Inputs

- JSON array file produced by `postcheck_scan_suspicious.mjs`
- Google Sheet (read-write in `--apply` mode)
- Git working tree (must be clean in `--apply` mode)

## Examples

```bash
# Step 1: Run scan and save output
node scripts/postcheck_scan_suspicious.mjs --out /tmp/postcheck.json

# Step 2: Preview what would happen (dry-run, default)
node scripts/postcheck_apply_actions.mjs --from /tmp/postcheck.json

# Step 3: Apply only BLACKLIST entries (max 2 deletions)
node scripts/postcheck_apply_actions.mjs \
  --from /tmp/postcheck.json \
  --apply \
  --only-status BLACKLIST \
  --max-delete 2

# Apply all candidates (BLACKLIST + NEEDS_REVIEW), no PR
node scripts/postcheck_apply_actions.mjs \
  --from /tmp/postcheck.json \
  --apply \
  --no-pr
```

## Output format (JSON stdout)

**Dry-run:**
```json
{
  "dry_run": true,
  "candidates": [
    {
      "row": 163,
      "slug": "waveai",
      "recommended_status": "BLACKLIST",
      "confidence": 0.95,
      "reasons": ["seed_blacklist_domain"],
      "would_update_sheet": true,
      "would_delete_md": true
    }
  ]
}
```

**Applied:**
```json
{
  "applied": true,
  "commit": "abc1234",
  "actions": [
    {
      "row": 163,
      "slug": "waveai",
      "recommended_status": "BLACKLIST",
      "cell": "Tabellenblatt1!G163",
      "deleted_md": true
    }
  ],
  "errors": [],
  "pr_url": "https://github.com/fenstek/utildesk-motia/pull/84"
}
```

## Safety mechanisms

1. **Default dry-run**: Nothing changes without `--apply`.
2. **`--max-delete` guard**: If more BLACKLIST candidates than the limit, the script stops before any changes.
3. **Clean working tree required**: In `--apply` mode, any staged or modified tracked file causes an abort.
4. **Sheet-first**: The Sheet status is updated before deleting the MD file. If the Sheet update fails, the file is not deleted and the run is aborted.
5. **Commit scope**: Only `git rm` deletions of `content/tools/*.md` are committed; no other files.
6. **No changes to pipeline scripts**: This script does not touch `cron_publish_push.sh`, `test_run_9_full.mjs`, or any other pipeline component.

## Git / PR flow

- Works on the `autobot` branch (same as the publish cron).
- Pushes via `git push origin HEAD:autobot`.
- Creates a PR `autobot → master` using `gh pr create`.
- Auto-merges using `gh pr merge --merge --admin` (project convention), with 5 retries.

## Relation to pipeline

| Cron | postcheck |
|------|-----------|
| Runs every 6 h | Runs every 24 h (or manually) |
| Processes `NEW → DONE` | Processes `DONE → BLACKLIST/NEEDS_REVIEW` |
| Commits `content/tools/*.md` additions | Commits `content/tools/*.md` deletions |
| Pushes autobot, creates PR | Same |

The two processes are independent. The postcheck never touches `NEW` or `IN_PROGRESS` rows.
