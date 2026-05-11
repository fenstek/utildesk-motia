param(
  [string]$Repo = (Get-Location).Path,
  [string]$Remote = "origin",
  [string]$Branch = "master",
  [string]$ProductionWorktree = "C:\projects\utildesk-motia-production-sync",
  [switch]$SyncHub,
  [switch]$SyncUbuntu = ($env:UTILDESK_SYNC_UBUNTU_AFTER_WINDOWS -eq "1"),
  [switch]$NoUbuntuSync,
  [string]$UbuntuSsh = $(if ($env:UTILDESK_UBUNTU_SYNC_SSH) { $env:UTILDESK_UBUNTU_SYNC_SSH } else { "jgdus@100.98.97.98" }),
  [string]$UbuntuRepo = $(if ($env:UTILDESK_UBUNTU_SYNC_REPO) { $env:UTILDESK_UBUNTU_SYNC_REPO } else { "~/projects/utildesk-motia-worker" }),
  [int]$UbuntuConnectTimeoutSeconds = $(if ($env:UTILDESK_UBUNTU_SYNC_TIMEOUT) { [int]$env:UTILDESK_UBUNTU_SYNC_TIMEOUT } else { 20 }),
  [switch]$SkipMainFastForward,
  [switch]$NoProductionWorktree
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
  param(
    [string]$Cwd,
    [string[]]$GitArgs
  )
  & git -C $Cwd @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git failed in ${Cwd}: git $($GitArgs -join ' ')"
  }
}

function Get-GitOutput {
  param(
    [string]$Cwd,
    [string[]]$GitArgs
  )
  $output = & git -C $Cwd @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git failed in ${Cwd}: git $($GitArgs -join ' ')"
  }
  if ($null -eq $output) {
    return ""
  }
  return ($output -join "`n").Trim()
}

function Test-Remote {
  param(
    [string]$Cwd,
    [string]$Name
  )
  & git -C $Cwd remote get-url $Name *> $null
  return $LASTEXITCODE -eq 0
}

function Invoke-UbuntuSync {
  param(
    [string]$SshTarget,
    [string]$RemoteRepo,
    [int]$ConnectTimeoutSeconds
  )

  if ([string]::IsNullOrWhiteSpace($SshTarget)) {
    Write-Warning "[sync] Ubuntu sync requested but no SSH target is configured"
    return
  }

  $remoteScript = @"
set -euo pipefail
repo="$RemoteRepo"
if [[ "`$repo" == "~/"* ]]; then
  repo="`$HOME/`${repo:2}"
elif [[ "`$repo" == "~" ]]; then
  repo="`$HOME"
fi
cd "`$repo"
if [[ -f scripts/sync_after_remote_deploy.sh ]]; then
  bash scripts/sync_after_remote_deploy.sh --repo "`$repo" --sync-hub
else
  git fetch origin master autobot
  master_sha="`$(git rev-parse refs/remotes/origin/master)"
  autobot_sha="`$(git rev-parse refs/remotes/origin/autobot)"
  if [[ "`$master_sha" != "`$autobot_sha" ]]; then
    echo "ERROR: origin/master and origin/autobot differ on Ubuntu" >&2
    exit 1
  fi
  if [[ -z "`$(git status --porcelain)" ]]; then
    git pull --ff-only origin master
  else
    echo "WARNING: Ubuntu checkout is dirty; left untouched" >&2
    git status --short
  fi
fi
"@

  $encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($remoteScript))
  Write-Host "[sync] syncing Ubuntu worker via $SshTarget"
  & ssh -o BatchMode=yes -o ConnectTimeout=$ConnectTimeoutSeconds $SshTarget "printf '%s' '$encoded' | base64 -d | bash"
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "[sync] Ubuntu worker sync failed; production refs remain published"
  }
}

$RepoRoot = Get-GitOutput -Cwd $Repo -GitArgs @("rev-parse", "--show-toplevel")
Write-Host "[sync] repo: $RepoRoot"

Invoke-Git -Cwd $RepoRoot -GitArgs @("fetch", $Remote, $Branch, "autobot")

$RemoteMasterRef = "refs/remotes/$Remote/$Branch"
$RemoteAutobotRef = "refs/remotes/$Remote/autobot"
$RemoteMasterSha = Get-GitOutput -Cwd $RepoRoot -GitArgs @("rev-parse", $RemoteMasterRef)
$RemoteAutobotSha = Get-GitOutput -Cwd $RepoRoot -GitArgs @("rev-parse", $RemoteAutobotRef)

if ($RemoteMasterSha -ne $RemoteAutobotSha) {
  throw "$Remote/$Branch and $Remote/autobot are not aligned: $RemoteMasterSha vs $RemoteAutobotSha"
}

Write-Host "[sync] production head: $($RemoteMasterSha.Substring(0, 7))"

if ($SyncHub -and (Test-Remote -Cwd $RepoRoot -Name "hub")) {
  Invoke-Git -Cwd $RepoRoot -GitArgs @(
    "push",
    "hub",
    "${RemoteMasterRef}:refs/heads/$Branch",
    "${RemoteAutobotRef}:refs/heads/autobot"
  )
  Write-Host "[sync] hub master/autobot mirrored"
}

if (-not $SkipMainFastForward) {
  $mainStatus = Get-GitOutput -Cwd $RepoRoot -GitArgs @("status", "--porcelain")
  if ([string]::IsNullOrWhiteSpace($mainStatus)) {
    $localHead = Get-GitOutput -Cwd $RepoRoot -GitArgs @("rev-parse", "HEAD")
    $base = Get-GitOutput -Cwd $RepoRoot -GitArgs @("merge-base", "HEAD", $RemoteMasterRef)
    if ($localHead -eq $RemoteMasterSha) {
      Write-Host "[sync] main checkout already at production head"
    } elseif ($base -eq $localHead) {
      Invoke-Git -Cwd $RepoRoot -GitArgs @("pull", "--ff-only", $Remote, $Branch)
      Write-Host "[sync] main checkout fast-forwarded"
    } else {
      Write-Warning "[sync] main checkout is clean but not a fast-forward candidate; left untouched"
    }
  } else {
    Write-Warning "[sync] main checkout is dirty; left untouched"
    Write-Host $mainStatus
  }
}

if (-not $NoProductionWorktree) {
  if (Test-Path -LiteralPath $ProductionWorktree) {
    $syncStatus = Get-GitOutput -Cwd $ProductionWorktree -GitArgs @("status", "--porcelain")
    if (-not [string]::IsNullOrWhiteSpace($syncStatus)) {
      throw "Production sync worktree is dirty: $ProductionWorktree"
    }
    Invoke-Git -Cwd $ProductionWorktree -GitArgs @("fetch", $Remote, $Branch, "autobot")
    Invoke-Git -Cwd $ProductionWorktree -GitArgs @("pull", "--ff-only", $Remote, $Branch)
  } else {
    $parent = Split-Path -Parent $ProductionWorktree
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
      New-Item -ItemType Directory -Path $parent | Out-Null
    }
    Invoke-Git -Cwd $RepoRoot -GitArgs @(
      "worktree",
      "add",
      "-B",
      "codex/production-sync",
      $ProductionWorktree,
      "$Remote/$Branch"
    )
  }

  $syncHead = Get-GitOutput -Cwd $ProductionWorktree -GitArgs @("rev-parse", "HEAD")
  if ($syncHead -ne $RemoteMasterSha) {
    throw "Production sync worktree did not reach $($RemoteMasterSha.Substring(0, 7))"
  }
  Write-Host "[sync] production memory mirror: $ProductionWorktree"
}

if (-not $NoProductionWorktree) {
  Write-Host "[sync] memory files to read after remote deploy:"
  Write-Host "  $ProductionWorktree\memory\recent_changes.md"
  Write-Host "  $ProductionWorktree\HANDOFF.md"
  Write-Host "  $ProductionWorktree\memory\decisions.md"
}

if ($SyncUbuntu -and -not $NoUbuntuSync) {
  Invoke-UbuntuSync -SshTarget $UbuntuSsh -RemoteRepo $UbuntuRepo -ConnectTimeoutSeconds $UbuntuConnectTimeoutSeconds
}

Write-Host "[sync] complete"
