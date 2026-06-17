param(
  [Parameter(Mandatory = $true)]
  [string]$HubRef,
  [string]$Repo = (Get-Location).Path,
  [string]$Remote = "origin",
  [string]$Branch = "master",
  [string]$HubRemote = "hub",
  [string]$DeployWorktree = "",
  [switch]$SkipBuild,
  [switch]$SkipIndexNow
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

$RepoRoot = Get-GitOutput -Cwd $Repo -GitArgs @("rev-parse", "--show-toplevel")
$Stamp = Get-Date -Format "yyyyMMddHHmmss"

if ([string]::IsNullOrWhiteSpace($DeployWorktree)) {
  $DeployWorktree = "C:\projects\utildesk-motia-deploy-hub-$Stamp"
}

Write-Host "[publish-hub] repo: $RepoRoot"
Write-Host "[publish-hub] hub ref: $HubRef"

Invoke-Git -Cwd $RepoRoot -GitArgs @("fetch", $Remote, $Branch, "autobot")
Invoke-Git -Cwd $RepoRoot -GitArgs @("fetch", $HubRemote, "refs/heads/${HubRef}")

$HubCommit = Get-GitOutput -Cwd $RepoRoot -GitArgs @("rev-parse", "FETCH_HEAD")
$OriginMaster = Get-GitOutput -Cwd $RepoRoot -GitArgs @("rev-parse", "refs/remotes/$Remote/$Branch")

& git -C $RepoRoot merge-base --is-ancestor $OriginMaster $HubCommit
if ($LASTEXITCODE -ne 0) {
  throw "Hub ref $HubRef is not based on $Remote/$Branch. Rebase it before publishing."
}

if (Test-Path -LiteralPath $DeployWorktree) {
  throw "Deploy worktree already exists: $DeployWorktree"
}

$DeployBranch = "codex/deploy-hub-$Stamp"
Invoke-Git -Cwd $RepoRoot -GitArgs @("worktree", "add", "-B", $DeployBranch, $DeployWorktree, $HubCommit)

$range = "refs/remotes/$Remote/$Branch..HEAD"
$changed = Get-GitOutput -Cwd $DeployWorktree -GitArgs @("diff", "--name-only", $range)

if (-not [string]::IsNullOrWhiteSpace($changed)) {
  Write-Host "[publish-hub] changed files:"
  $changed -split "`n" | ForEach-Object { Write-Host "  - $_" }

  $needsMemory = $false
  foreach ($line in ($changed -split "`n")) {
    if ($line -match "^(content/|scripts/|site/|docs/04_operations/)") {
      $needsMemory = $true
    }
  }
  if ($needsMemory -and ($changed -notmatch "(^|`n)(memory/recent_changes\.md|memory/decisions\.md|HANDOFF\.md)(`n|$)")) {
    throw "Hub release touches production-relevant files but lacks tracked memory or handoff updates."
  }
}

Invoke-Git -Cwd $DeployWorktree -GitArgs @("diff", "--check", $range)

if (-not $SkipBuild) {
  if (Test-Path -LiteralPath (Join-Path $DeployWorktree "package.json")) {
    npm --prefix $DeployWorktree run check:editorial
    if ($LASTEXITCODE -ne 0) { throw "npm run check:editorial failed" }
  }

  if (Test-Path -LiteralPath (Join-Path $DeployWorktree "scripts/check_english_tool_translations.mjs")) {
    node (Join-Path $DeployWorktree "scripts/check_english_tool_translations.mjs")
    if ($LASTEXITCODE -ne 0) { throw "English tool translation check failed" }
  }

  $siteDir = Join-Path $DeployWorktree "site"
  if (Test-Path -LiteralPath (Join-Path $siteDir "package.json")) {
    $astroCmd = Join-Path $siteDir "node_modules/.bin/astro.cmd"
    $astroSh = Join-Path $siteDir "node_modules/.bin/astro"
    if ((Test-Path -LiteralPath (Join-Path $siteDir "package-lock.json")) -and -not (Test-Path -LiteralPath $astroCmd) -and -not (Test-Path -LiteralPath $astroSh)) {
      npm --prefix $siteDir ci
      if ($LASTEXITCODE -ne 0) { throw "site npm ci failed" }
    }
    npm --prefix $siteDir run build
    if ($LASTEXITCODE -ne 0) { throw "site build failed" }
    Invoke-Git -Cwd $DeployWorktree -GitArgs @("restore", "--", "site/src/data/content-lastmod.json", "site/src/data/tool-added-at.json")
  }

  $postBuildStatus = Get-GitOutput -Cwd $DeployWorktree -GitArgs @("status", "--porcelain")
  if (-not [string]::IsNullOrWhiteSpace($postBuildStatus)) {
    Write-Host $postBuildStatus
    throw "Checks/build left the deploy worktree dirty."
  }
}

Invoke-Git -Cwd $DeployWorktree -GitArgs @("push", $Remote, "HEAD:$Branch")
Invoke-Git -Cwd $DeployWorktree -GitArgs @("push", $Remote, "HEAD:autobot")
Invoke-Git -Cwd $DeployWorktree -GitArgs @("push", $HubRemote, "HEAD:$Branch", "HEAD:autobot")

if (-not $SkipIndexNow -and (Test-Path -LiteralPath (Join-Path $DeployWorktree "scripts/indexnow_submit.py"))) {
  python (Join-Path $DeployWorktree "scripts/indexnow_submit.py") submit-git-range --rev-range $range --wait-live
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "IndexNow submit failed after deploy; production push is already complete."
  }
}

$head = Get-GitOutput -Cwd $DeployWorktree -GitArgs @("rev-parse", "--short", "HEAD")
Write-Host "[publish-hub] complete: $head"
Write-Host "[publish-hub] run laptop sync next:"
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/sync_after_remote_deploy.ps1 -SyncHub"
