# Sentinel - remove the Windows desktop shortcut.
$Desktop = [Environment]::GetFolderPath("Desktop")
$removed = $false
foreach ($file in @("Launch Sentinel.bat", "Sentinel.lnk")) {
    $path = Join-Path $Desktop $file
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "Removed $path" -ForegroundColor Green
        $removed = $true
    }
}
if (-not $removed) { Write-Host "Nothing to remove." }
