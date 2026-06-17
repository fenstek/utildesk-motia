# Utildesk-Motia Checkpoints

Good states and important restoration points.

---

## 2026-04-25 22:10 Europe/Berlin - Ratgeber Editorial Illustration Baseline

**Commit:** `24dbdc3`
**Status:** GOOD STATE

### Why this is a good state

- `tools.utildesk.de` was deployed through Cloudflare Pages from the built `site/dist`.
- Live checks returned `200` for `/`, `/tools/`, `/ratgeber/`, the updated Ratgeber article, two Ratgeber PNG assets, and a representative tool logo asset.
- The live Ratgeber PNG hash matched the local generated PNG, confirming Cloudflare serves the new artwork and not stale cache.
- Published Ratgeber images now use the softer Utildesk editorial illustration direction instead of the earlier terminal/block-diagram style.
- The `opcl` Ratgeber candidate sync script was updated and tested so new candidates render PNG previews in the same editorial direction.
- IndexNow submission for the homepage, tools index, Ratgeber index, and all published Ratgeber articles returned `200` from both IndexNow endpoints.

### Restore target

Use this commit as the current safe restore point for the repo and live Ratgeber illustration baseline.

```bash
git checkout 24dbdc3
```

---

## 2026-04-22 16:30 UTC - Current Site Healthy Baseline

**Commit:** `fa1c42d11a995127f3be253eb94477252e4c79ff`
**Status:** GOOD STATE

### Why this is a good state

- `origin/master = origin/autobot = fa1c42d11a995127f3be253eb94477252e4c79ff`
- the main local checkout was cleaned and aligned to the same commit
- `tools.utildesk.de`, `/sitemap.xml`, `/ratgeber/`, and the latest `ratgeber` article returned `200`
- homepage and latest article exposed the expected canonical URLs and no `noindex`
- the Windows-hostile case-only duplicate audit doc path was removed from the repo tree

### Restore target

Use this commit as the current safe restore point for the repo and the live site baseline.

```bash
git checkout fa1c42d11a995127f3be253eb94477252e4c79ff
```

---

## 2026-02-16 15:45 UTC - Pipeline Restoration Complete

**Tag:** `checkpoint-good-20260216-1545`
**Commit:** `0f5b6ccaae11eb6bbc90d3d6066758972dceec63`
**Status:** ✅ GOOD STATE

### Why this is a good state

- ✅ **Pipeline fully operational**: publish → commit → push → PR → deploy flow working
- ✅ **Zero IN_PROGRESS rows**: all stuck records cleared
- ✅ **Successful deployments**: 3 tools deployed and verified (HTTP 200)
  - botsify.md
  - ibm-watson-assistant.md
  - microsoft-bot-framework.md
- ✅ **Clean repository state**: no untracked/blocking files
- ✅ **autobot/master synchronized**: ready for next cron run

### What was fixed

1. **Root cause identified and resolved**
   - Temporary `audit_missing_categories.*` files were blocking commit/push
   - cron wrapper allowlist correctly rejected unexpected files
   - Files removed and pattern added to `.gitignore`

2. **Tools added**
   - Created `scripts/check_stuck_in_progress.mjs` - diagnostic script for monitoring IN_PROGRESS rows
   - Created `scripts/check_stuck_in_progress.md` - documentation

3. **Data cleanup**
   - Rows 99, 101, 109: IN_PROGRESS → DONE (files published successfully)
   - Rows 111, 147: IN_PROGRESS → NEW (reset for reprocessing)

4. **Verification**
   - All 3 published tools accessible on production
   - Google Sheets audit: 219 total rows, 0 IN_PROGRESS
   - Git state: clean, synchronized, ready

### Files changed in this fix

- `.gitignore` - added audit output pattern
- `content/tools/botsify.md` - created
- `content/tools/ibm-watson-assistant.md` - created
- `content/tools/microsoft-bot-framework.md` - created
- `scripts/check_stuck_in_progress.mjs` - created
- `scripts/check_stuck_in_progress.md` - created

### Backup artifacts

- Checkpoint proof: `/var/log/utildesk-motia/checkpoints/checkpoint_20260216_154506.json`
- Repository backup: `/opt/utildesk-backups/utildesk-motia/` (see server backups)

---

## How to restore from this checkpoint

### Git restore
```bash
git checkout checkpoint-good-20260216-1545
# or
git reset --hard 0f5b6ccaae11eb6bbc90d3d6066758972dceec63
```

### Verify state after restore
```bash
node scripts/check_stuck_in_progress.mjs
git log -1 --oneline
```

### Server backup restore
See `/opt/utildesk-backups/utildesk-motia/README.md` for backup restoration procedures.

---
