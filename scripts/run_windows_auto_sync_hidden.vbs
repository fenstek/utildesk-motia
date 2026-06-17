Option Explicit

Dim shell, fso, scriptDir, ps1, cmd

Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
ps1 = fso.BuildPath(scriptDir, "run_windows_auto_sync.ps1")

cmd = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File " & Chr(34) & ps1 & Chr(34)

Set shell = CreateObject("WScript.Shell")
shell.Run cmd, 0, False
