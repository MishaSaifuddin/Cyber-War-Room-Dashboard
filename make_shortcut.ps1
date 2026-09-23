# Creates a "Cyber War Room" shortcut on the Desktop that carries the app icon,
# plus refreshes the Windows icon cache so the taskbar shows the custom icon.
$ErrorActionPreference = 'Stop'

$AppDir   = 'C:\Users\Misha\cyber-war-room-dashboard'
$ExePath  = Join-Path $AppDir 'dist\CyberWarRoom.exe'
$IcoPath  = Join-Path $AppDir 'assets\war_room.ico'

if (-not (Test-Path $ExePath)) { Write-Host "ERROR: exe not found at $ExePath" -ForegroundColor Red; exit 1 }
if (-not (Test-Path $IcoPath))  { Write-Host "ERROR: icon not found at $IcoPath"  -ForegroundColor Red; exit 1 }

$Desktop = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop 'Cyber War Room.lnk'

$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($ShortcutPath)
$sc.TargetPath       = $ExePath
$sc.WorkingDirectory = Split-Path $ExePath
$sc.Description      = 'Cyber War Room - Security Operations Dashboard'
$sc.IconLocation     = "$IcoPath, 0"
$sc.Save()

Write-Host "Shortcut created: $ShortcutPath" -ForegroundColor Green
Write-Host "Icon set to: $IcoPath" -ForegroundColor Green
Write-Host ""

# Refresh the Windows icon cache so any stale generic icons clear out.
Write-Host "Refreshing Windows icon cache..." -ForegroundColor Yellow
Start-Process ie4uinit.exe -ArgumentList '-show' -WindowStyle Hidden -Wait
Write-Host "Icon cache refreshed." -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEP: Right-click the new desktop shortcut -> Show more options -> Pin to taskbar"
Write-Host "The taskbar will now display the custom Cyber War Room icon."