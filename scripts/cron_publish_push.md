# cron_publish_push.sh

Automated content publishing workflow for utildesk-motia.

## Overview

This script runs every 6 hours to:
1. Sync working copy with latest code
2. Generate new tool pages from Google Sheet
3. Commit changes to `autobot` branch
4. Create/update PR to `master`
5. Auto-merge PR (if checks pass)
6. Fast-forward sync `master` with merged changes

## Divergence Self-Heal

### Problem

When `origin/master` advances via manual PRs (e.g., hotfixes, redirects, aliases) while `origin/autobot` remains on an older commit, a divergence occurs:

```
origin/master:  [newer commits from manual PRs]
                     ↑
                  (diverged)
                     ↓
origin/autobot: [old autogen commit]
```

Without self-healing, the script would:
- Reset to `origin/autobot` (stale code)
- Generate content on outdated codebase
- Miss critical fixes, aliases, redirects

### Solution

After `git fetch --all --prune`, the script checks:

```bash
if ! git merge-base --is-ancestor "origin/master" "origin/autobot"; then
  # Divergence detected -> reset autobot to master
  git checkout -B autobot origin/master
  git push -f origin autobot
fi
```

**Key behaviors:**
- ✅ Detects when `origin/master` is NOT an ancestor of `origin/autobot`
- ✅ Resets `origin/autobot` to `origin/master` (force push)
- ✅ Ensures next generation uses latest code
- ✅ Only affects `autobot` branch (never force-pushes `master`)

### Typical Logs

**Normal case (no divergence):**
```
[cron] start: ...
git fetch --all --prune
# (no divergence warning)
remote branch exists -> hard reset local to it
...
```

**Divergence case (self-heal triggered):**
```
[cron] start: ...
git fetch --all --prune
[cron] WARN: origin/autobot diverged from origin/master -> resetting autobot to origin/master
To https://github.com/fenstek/utildesk-motia.git
 + 919352a...4bd21d4 autobot -> autobot (forced update)
[cron] origin/autobot reset complete
...
```

### Why Master is Never Force-Pushed

**Safety principles:**
- `master` is protected branch with merge requirements
- Only `autobot` PRs can update `master` (via auto-merge)
- Force-pushing `master` would bypass protections
- Self-heal only resets `autobot` (working branch) to match `master`

## Environment Variables

**None required.** Inherits from cron via `bash -lc`.

**Optional:** `PUBLISH_ONLY=1` - Skip generation

## Monitoring

**Logs:** `/var/log/utildesk-motia/publish.log`

**Check last run:**
```bash
tail -20 /var/log/utildesk-motia/publish.log
```
