@echo off
setlocal

cd /d "%~dp0"
title DashCam Audit Fix Launcher

echo ==========================================
echo   DashCam Repair and Launch
echo ==========================================
echo.
echo This will run:
echo 1. npm install
echo 2. npm audit fix --force
echo 3. npm run dev
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

echo Running npm install...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo npm install failed.
    echo.
    pause
    exit /b 1
)

echo.
echo Running npm audit fix --force...
echo.
call npm audit fix --force
if errorlevel 1 (
    echo.
    echo npm audit fix --force failed.
    echo.
    pause
    exit /b 1
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
