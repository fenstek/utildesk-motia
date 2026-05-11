param(
  [string]$TaskName = "UtildeskMotiaAutoSync",
  [string]$RunScript = "C:\projects\utildesk-motia-production-sync\scripts\run_windows_auto_sync.ps1",
  [int]$IntervalMinutes = 5
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $RunScript)) {
  throw "Auto-sync runner not found: $RunScript"
}

$escapedScript = $RunScript.Replace('"', '\"')
$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$escapedScript`""

$trigger = New-ScheduledTaskTrigger `
  -Once `
  -At ((Get-Date).AddMinutes(1)) `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
  -RepetitionDuration (New-TimeSpan -Days 3650)

$settings = New-ScheduledTaskSettingsSet `
  -MultipleInstances IgnoreNew `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Keeps utildesk-motia production memory synced between Windows, Ubuntu, GitHub, and hub." `
  -Force | Out-Null

Start-ScheduledTask -TaskName $TaskName

Write-Host "TASK_INSTALLED=$TaskName"
Write-Host "INTERVAL_MINUTES=$IntervalMinutes"
Write-Host "RUN_SCRIPT=$RunScript"
