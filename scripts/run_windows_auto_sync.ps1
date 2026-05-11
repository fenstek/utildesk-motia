param(
  [string]$Repo = "C:\projects\utildesk-motia",
  [string]$SyncScript = "C:\projects\utildesk-motia-production-sync\scripts\sync_after_remote_deploy.ps1",
  [string]$LogDir = "C:\projects\utildesk-motia-production-sync\logs",
  [switch]$NoUbuntuSync
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$LogFile = Join-Path $LogDir "auto-sync.log"
$Mutex = New-Object System.Threading.Mutex($false, "Global\UtildeskMotiaAutoSync")
$HasLock = $false

function Write-AutoSyncLog {
  param([string]$Message)
  $stamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"
  Add-Content -Path $LogFile -Value "[$stamp] $Message"
}

try {
  $HasLock = $Mutex.WaitOne(0)
  if (-not $HasLock) {
    Write-AutoSyncLog "skip: another auto-sync is already running"
    exit 0
  }

  Write-AutoSyncLog "start: windows auto-sync"
  $syncArgs = @("-Repo", $Repo, "-SyncHub")
  if ($NoUbuntuSync) {
    $syncArgs += "-NoUbuntuSync"
  }

  & $SyncScript @syncArgs *>> $LogFile
  Write-AutoSyncLog "complete: windows auto-sync"
} catch {
  Write-AutoSyncLog "ERROR: $($_.Exception.Message)"
  exit 1
} finally {
  if ($HasLock) {
    $Mutex.ReleaseMutex() | Out-Null
  }
  $Mutex.Dispose()
}
