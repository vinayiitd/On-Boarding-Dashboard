@echo off
setlocal enableextensions
title Sentinel - AI Compliance Officer

REM Sentinel launcher for Windows. Double-click from Desktop to start.
REM SENTINEL_APP_DIR is set by install-desktop-shortcut.ps1 when installed.

if defined SENTINEL_APP_DIR (
    set "APP_DIR=%SENTINEL_APP_DIR%"
) else (
    set "SCRIPT_DIR=%~dp0"
    if exist "%SCRIPT_DIR%..\..\kyc-platform\package.json" (
        set "APP_DIR=%SCRIPT_DIR%..\..\kyc-platform"
    ) else if exist "%SCRIPT_DIR%..\kyc-platform\package.json" (
        set "APP_DIR=%SCRIPT_DIR%..\kyc-platform"
    )
)

if not defined APP_DIR (
    echo.
    echo [ERROR] Could not locate the Sentinel project.
    echo         Re-run install-desktop-shortcut.ps1 from the kyc-platform folder.
    echo.
    pause
    exit /b 1
)

pushd "%APP_DIR%"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js is not installed.
    echo         Please install Node.js 20+ from https://nodejs.org and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo Sentinel - AI Compliance Officer
echo ---------------------------------
echo Project:  %CD%
for /f "delims=" %%V in ('node -v') do echo Node:     %%V
echo.

if not exist node_modules (
    echo Installing dependencies ^(first-run, one minute^)...
    call npm install --silent
)

if not exist .next (
    echo Building production bundle ^(one-time^)...
    call npm run build
)

echo Starting Sentinel on http://localhost:3000
start "" "http://localhost:3000"

call npm run start
popd
endlocal
