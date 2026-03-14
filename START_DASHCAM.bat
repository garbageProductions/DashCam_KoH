@echo off
setlocal

cd /d "%~dp0"
title DashCam Launcher

echo ==========================================
echo   DashCam One-Click Launcher
echo ==========================================
echo.

if not exist package.json (
    echo ERROR: package.json was not found in:
    echo %CD%
    echo.
    pause
    exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo Please install Node.js 16 or newer:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm is not available.
    echo Please reinstall Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Checking dependencies...
if not exist node_modules (
    echo node_modules not found, running npm install...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo npm install failed.
        echo.
        pause
        exit /b 1
    )
) else (
    echo Dependencies already exist. Running npm install anyway to make sure everything is ready...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo npm install failed.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Starting DashCam...
echo Leave this window open while the app is running.
echo.

call npm run dev

echo.
echo DashCam has stopped.
pause
exit /b 0
