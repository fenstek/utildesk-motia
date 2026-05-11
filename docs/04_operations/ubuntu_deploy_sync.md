# Ubuntu deploy and laptop sync

This runbook keeps the Ubuntu image/text worker, the Windows laptop, GitHub
production refs, and tracked project memory aligned.

## Contract

- `origin/master` is the production source of truth.
- `origin/autobot` must be aligned to the same commit after every manual deploy.
- Remote work must update tracked memory in the same release:
  `memory/recent_changes.md`, `memory/decisions.md`, or `HANDOFF.md`.
- The deploy worktree must be clean before publication.
- The Ubuntu worker may use ChatGPT web/subscription workflows, but must not
  commit browser profiles, cookies, raw downloads, or API secrets.

## Direct deploy from Ubuntu

Use this when the Ubuntu SSH key or HTTPS credential can push to GitHub.

```bash
cd ~/projects/utildesk-motia-worker
source ~/utildesk-chatgpt-worker/env.sh
git fetch origin master autobot
git pull --ff-only origin master

# Do the work, update project memory/handoff, then commit.
git status --short
bash scripts/deploy_from_ubuntu.sh
```

Current worker paths:

- Ubuntu repo: `~/projects/utildesk-motia-worker`
- Ubuntu env file: `~/utildesk-chatgpt-worker/env.sh`
- Ubuntu clean production mirror: `~/projects/utildesk-motia-production-sync`
- Windows main checkout: `C:\projects\utildesk-motia`
- Windows clean production mirror: `C:\projects\utildesk-motia-production-sync`

For a direct Ubuntu deploy, `env.sh` should contain the non-secret laptop sync
target:

```bash
export UTILDESK_REPO="$HOME/projects/utildesk-motia-worker"
export UTILDESK_WINDOWS_SYNC_SSH="sserg@100.84.157.110"
export UTILDESK_WINDOWS_SYNC_REPO="C:\\projects\\utildesk-motia"
export UTILDESK_WINDOWS_SYNC_SCRIPT="C:\\projects\\utildesk-motia-production-sync\\scripts\\sync_after_remote_deploy.ps1"
export UTILDESK_WINDOWS_SYNC_HUB=1
```

The GitHub write token is stored outside the repo in Ubuntu's Git credential
store (`~/.git-credentials`, mode `0600`). Do not commit it, print it, or paste
it into project memory.

The script checks:

- clean worktree;
- current HEAD is based on `origin/master`;
- production-relevant changes include tracked memory/handoff;
- `git diff --check`;
- editorial checks and site build;
- `origin/master` and `origin/autobot` end at the same commit;
- `hub/master` and `hub/autobot` are mirrored when the hub remote exists;
- the Windows production-memory mirror is updated via SSH when
  `UTILDESK_WINDOWS_SYNC_SSH` is set;
- IndexNow notification for changed canonical pages.

If GitHub still denies the Ubuntu key, the script pushes a pending hub ref and
prints the Windows finalization command.

## Hub fallback from Ubuntu

Use this while Ubuntu still cannot push to GitHub directly.

```bash
cd ~/projects/utildesk-motia-worker
source ~/utildesk-chatgpt-worker/env.sh
bash scripts/deploy_from_ubuntu.sh --hub-only
```

Then run the printed command on the Windows laptop, for example:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/publish_hub_ref_from_windows.ps1 -HubRef codex/pending-ubuntu-deploy-YYYYMMDDHHMMSS
```

The Windows helper publishes that hub ref to `origin/master` and
`origin/autobot`, mirrors it back to `hub`, runs checks/build, and submits
IndexNow.

## Laptop sync after any remote deploy

Run this on the Windows laptop after Ubuntu deploys directly, or after the hub
fallback finalizer:

```powershell
cd C:\projects\utildesk-motia
powershell -ExecutionPolicy Bypass -File scripts/sync_after_remote_deploy.ps1 -SyncHub
```

Behavior:

- fetches `origin/master` and `origin/autobot`;
- fails if those refs are not equal;
- mirrors production refs to `hub` when `-SyncHub` is passed;
- fast-forwards the main checkout only if it is clean and safe;
- if the main checkout is dirty, leaves it untouched and updates a clean
  production memory mirror at `C:\projects\utildesk-motia-production-sync`.

When the main checkout is dirty, future agents should read memory from the
production mirror before deciding whether local dirty files are stale or user
work-in-progress.

## Ubuntu sync after a Windows deploy

Windows syncs the Ubuntu worker by default after a production sync. Use
`-NoUbuntuSync` only when the Ubuntu machine is intentionally offline or you do
not want the callback.

```powershell
$env:UTILDESK_UBUNTU_SYNC_SSH = "jgdus@100.98.97.98"
$env:UTILDESK_UBUNTU_SYNC_REPO = "~/projects/utildesk-motia-worker"
powershell -ExecutionPolicy Bypass -File scripts/sync_after_remote_deploy.ps1 -SyncHub
```

On Ubuntu the equivalent manual command is:

```bash
cd ~/projects/utildesk-motia-worker
bash scripts/sync_after_remote_deploy.sh --sync-hub
```

Behavior:

- fetches `origin/master` and `origin/autobot`;
- fails if those refs are not equal;
- mirrors production refs to `hub` when `--sync-hub` is passed;
- fast-forwards the worker checkout only when it is clean and safe;
- if the worker checkout is dirty, leaves it untouched and updates the clean
  production memory mirror at `~/projects/utildesk-motia-production-sync`.
