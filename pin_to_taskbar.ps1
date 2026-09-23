# Pins the "Cyber War Room" shortcut to the Windows taskbar.
$ErrorActionPreference = 'Continue'

$Desktop = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop 'Cyber War Room.lnk'

if (-not (Test-Path $ShortcutPath)) {
    Write-Host "ERROR: shortcut not found at $ShortcutPath" -ForegroundColor Red
    exit 1
}

# Method 1: invoke the "Pin to taskbar" shell verb on the shortcut
Write-Host "Trying shell verb 'Pin to taskbar'..." -ForegroundColor Yellow
$shell = New-Object -ComObject shell.application
$folder = $shell.Namespace($Desktop)

function Find-PinVerb($item) {
    $verbs = $item.Verbs()
    for ($i = 0; $i -lt $verbs.Count; $i++) {
        $name = $verbs.Item($i).Name.Replace('&', '')
        if ($name -ieq 'Pin to taskbar' -or $name -ieq 'Pin intune') {
            return $verbs.Item($i)
        }
    }
    return $null
}

$item = $folder.ParseName('Cyber War Room.lnk')
if ($item) {
    $verb = Find-PinVerb $item
    if ($verb) {
        $verb.DoIt()
        Write-Host "Pin verb invoked." -ForegroundColor Green
    } else {
        Write-Host "No 'Pin to taskbar' verb found on shortcut (common in Win11). Trying fallback..." -ForegroundColor Yellow
    }
} else {
    Write-Host "Could not parse shortcut from desktop." -ForegroundColor Yellow
}

# Wait a moment for the pin operation
Start-Sleep -Seconds 2

# Method 2 (fallback): 
# Copy the shortcut into the "User Pinned TaskBar" folder (Windows 10/11)
$PinnedFolder = Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar'
if (Test-Path $PinnedFolder) {
    Copy-Item -Path $ShortcutPath -Destination $PinnedFolder -Force
    Write-Host "Also copied shortcut into pinned folder: $PinnedFolder" -ForegroundColor Green

    # If Explorer isn't showing it, restart Explorer to refresh the taskbar
    Write-Host "Restarting Explorer to refresh the taskbar..." -ForegroundColor Yellow
    Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    if (-not (Get-Process -Name explorer -ErrorAction SilentlyContinue)) {
        Start-Process explorer.exe
    }
} else {
    Write-Host "Pinned TaskBar folder not found at: $PinnedFolder" -ForegroundColor Yellow
    Write-Host "(No fallback used. The pin verb may have already worked.)"
}

Start-Sleep -Seconds 2
Write-Host ""
Write-Host "Done. Check your taskbar for the Cyber War Room icon." -ForegroundColor Green