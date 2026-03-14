# DashCam Onboarding Guide

## Quick Start

1. Unzip the folder and open the new `DashCam_KoH` folder.
2. Double-click `install.bat`.
3. After install finishes, double-click `START_DASHCAM.bat`.
4. A terminal window should open.
5. Your output may look similar to Example 1 below. That is okay.
6. Hold `Ctrl + C` for a few seconds to stop the terminal.
7. The terminal may print several lines while stopping. That is normal. You can close the window after it stops. If it auto-closes, that is also fine.
8. Double-click `START_DASHCAM_AUDIT_FIX.bat`.
9. Wait for the terminal to show a local web link similar to Example 2 below.
10. Hover over the link, hold `Ctrl`, and click it to open DashCam in your browser.
11. Press the `Right Shift` key to show or hide the in-app menu.

## Example 1: First Launch Output

```text
Checking dependencies...
node_modules not found, running npm install...

added 69 packages, and audited 70 packages
2 high severity vulnerabilities

Starting DashCam...
Leave this window open while the app is running.

> dashcam@2.0.0 dev
> vite

Port 5173 is in use, trying another one...

Local: http://127.0.0.1:5174/
```

This output is not a problem. The important part is that DashCam starts and shows a local link.

## Example 2: Repair and Launch Output

```text
DashCam Repair and Launch

This will run:
1. npm install
2. npm audit fix --force
3. npm run dev

Running npm install...
Running npm audit fix --force...

found 0 vulnerabilities

Starting DashCam...

Local: http://127.0.0.1:5174/
```

If you see a local link, DashCam is ready to open in your browser.

## Docs

### What each file does

- `install.bat` installs the project dependencies.
- `START_DASHCAM.bat` starts DashCam.
- `START_DASHCAM_AUDIT_FIX.bat` repairs packages with `npm audit fix --force` and then starts DashCam.

### Normal startup

Use `START_DASHCAM.bat` for regular use.

### Repair startup

Use `START_DASHCAM_AUDIT_FIX.bat` when:

- DashCam is not starting correctly.
- You were told to run the repair version.
- You want to clear audit warnings before launching.

## FAQ

### A terminal window opened. Is that normal?

Yes. DashCam runs from that terminal window. Leave it open while using DashCam.

### I see a lot of lines in the terminal. Did something break?

Usually no. Most of the lines are normal install or startup messages.

### It says the port is in use and picks another one. Is that bad?

No. DashCam will choose another local port automatically.

### The window closed by itself. What should I do?

Try `START_DASHCAM_AUDIT_FIX.bat` next. If it still closes immediately, check whether Node.js is installed.

### How do I open DashCam in my browser?

Look for the `Local:` link in the terminal, then hold `Ctrl` and click the link.

### How do I open the DashCam menu?

Press the `Right Shift` key.
