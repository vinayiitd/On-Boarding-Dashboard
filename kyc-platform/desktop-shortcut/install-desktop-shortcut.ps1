# Sentinel - desktop shortcut installer for Windows.
#
# Usage:  Right-click -> "Run with PowerShell"
#         or from a shell:
#           powershell -ExecutionPolicy Bypass -File .\install-desktop-shortcut.ps1
#
# Creates a real Windows .lnk on your Desktop that launches the app.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoDir   = Resolve-Path (Join-Path $ScriptDir "..")
$LauncherSrc = Join-Path $ScriptDir "launchers\Launch Sentinel.bat"
$IconSrc     = Join-Path $ScriptDir "sentinel-icon.svg"

if (-not (Test-Path (Join-Path $RepoDir "package.json"))) {
    Write-Host "ERROR: Could not find kyc-platform\package.json next to this installer." -ForegroundColor Red
    Write-Host "       Expected layout: kyc-platform\desktop-shortcut\install-desktop-shortcut.ps1"
    exit 1
}

$Desktop = [Environment]::GetFolderPath("Desktop")
$LauncherDst = Join-Path $Desktop "Launch Sentinel.bat"
$ShortcutDst = Join-Path $Desktop "Sentinel.lnk"

Write-Host ""
Write-Host "Sentinel - installing desktop shortcut" -ForegroundColor Cyan
Write-Host "   Project:  $RepoDir" -ForegroundColor DarkGray
Write-Host "   Desktop:  $Desktop" -ForegroundColor DarkGray
Write-Host ""

# 1. Drop the .bat launcher on the desktop, prefixing it with the resolved
#    project path so it works no matter where the repo lives.
$BatContent = Get-Content $LauncherSrc -Raw
$WrappedBat = "@echo off`r`nset `"SENTINEL_APP_DIR=$RepoDir`"`r`n" + $BatContent
Set-Content -Path $LauncherDst -Value $WrappedBat -Encoding ASCII
Write-Host "Installed launcher: $LauncherDst" -ForegroundColor Green

# 2. Create a proper Windows .lnk that points at the launcher.
$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($ShortcutDst)
$Shortcut.TargetPath       = "cmd.exe"
$Shortcut.Arguments        = "/c `"`"$LauncherDst`"`""
$Shortcut.WorkingDirectory = $RepoDir
$Shortcut.Description      = "Sentinel - AI Compliance Officer"
$Shortcut.WindowStyle      = 1
$Shortcut.Save()
Write-Host "Installed shortcut: $ShortcutDst" -ForegroundColor Green

Write-Host ""
Write-Host "Double-click 'Sentinel' on your Desktop to launch."
Write-Host "The first run will install dependencies + build (~1 minute)."
Write-Host ""
Write-Host "Uninstall later with:  powershell -ExecutionPolicy Bypass -File desktop-shortcut\uninstall-desktop-shortcut.ps1" -ForegroundColor DarkGray
