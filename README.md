# DashCam
Dashcam is an overlay for the game HyperDash. This is used together with "HyperBash" a mod for HyperDash.

It uses websockets to connect to hyperdash on port 46646.

## ShowCase
![Screenshot](.github/ScreenShot1.png)

## Building
### using vite
- Install nodejs 16+ https://nodejs.org/
- open terminal and type 
- `"npm install"`
- `"npm run dev"`

## User Onboarding

For a simple end-user setup guide, see [docs/USER_ONBOARDING.md](docs/USER_ONBOARDING.md).

### Quick Start

1. Unzip the folder and open `DashCam_KoH`.
2. Double-click `install.bat`.
3. Double-click `START_DASHCAM.bat`.
4. If needed, stop it with `Ctrl + C`.
5. Double-click `START_DASHCAM_AUDIT_FIX.bat`.
6. Hold `Ctrl` and click the local link shown in the terminal.
7. Press `Right Shift` to open or hide the menu.

## FAQ

### Is the terminal window normal?

Yes. Leave it open while DashCam is running.

### What if I see vulnerability warnings?

That can happen during install. Use `START_DASHCAM_AUDIT_FIX.bat` if you want to run the repair flow.

### What if the port changes from `5173` to another number?

That is normal. Open the `Local:` link shown in the terminal.
