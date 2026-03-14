@echo off
setlocal

cd /d "%~dp0"
title DashCam Installer

echo ==========================================
echo   DashCam Install Helper
echo ==========================================
echo.
echo Working directory:
echo %CD%
echo.

if not exist package.json (
    echo ERROR: package.json was not found.
    echo Make sure this file stays in the repository root.
    echo.
    pause
    exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not on PATH.
    echo Install Node.js 16 or newer from https://nodejs.org/
    echo Then run this installer again.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm is not available on PATH.
    echo Reinstall Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

echo Detected versions:
node --version
npm --version
echo.
echo Installing project dependencies...
echo.

call npm install
if errorlevel 1 (
    echo.
    echo Install failed.
    echo If this keeps happening, open a terminal here and run:
    echo npm install
    echo.
    pause
    exit /b 1
)

echo.
echo Install complete.
echo You can start the app with:
echo npm run dev
echo.
pause
exit /b 0
