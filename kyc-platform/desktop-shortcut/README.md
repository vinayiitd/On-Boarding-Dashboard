# Desktop shortcut

Launch Sentinel from your Desktop with one double-click.

## Install

Requires **Node.js 20+** (https://nodejs.org). The installer detects your OS,
drops a launcher on your Desktop, and points it at this repository.

### macOS

```bash
bash kyc-platform/desktop-shortcut/install-desktop-shortcut.sh
```

You'll get a **`Launch Sentinel.command`** on your Desktop. Double-click it.
The first run installs dependencies and builds the production bundle
(≈ 1 minute); subsequent launches start immediately.

If macOS Gatekeeper blocks the first run, right-click → **Open** → **Open**.

### Linux

```bash
bash kyc-platform/desktop-shortcut/install-desktop-shortcut.sh
```

You'll get **`Sentinel — AI Compliance Officer`** on your Desktop and in your
app menu. Double-click to launch. On some distros you may need to right-click
the shortcut once and choose **Allow Launching**.

### Windows

Open PowerShell in the repository folder and run:

```powershell
powershell -ExecutionPolicy Bypass -File kyc-platform\desktop-shortcut\install-desktop-shortcut.ps1
```

You'll get a **`Sentinel.lnk`** shortcut on your Desktop that runs the app in
a console window and opens http://localhost:3000 in your default browser.

## What the launcher does

1. `cd` into the `kyc-platform/` project.
2. `npm install` if `node_modules/` is missing.
3. `npm run build` if `.next/` is missing.
4. `npm run start` on port 3000.
5. Opens **http://localhost:3000** in your default browser.

Close the terminal window that opens to stop the server.

## Uninstall

```bash
# macOS + Linux
bash kyc-platform/desktop-shortcut/uninstall-desktop-shortcut.sh

# Windows
powershell -ExecutionPolicy Bypass -File kyc-platform\desktop-shortcut\uninstall-desktop-shortcut.ps1
```

## Files

```
desktop-shortcut/
├── install-desktop-shortcut.sh     # macOS + Linux installer
├── install-desktop-shortcut.ps1    # Windows installer
├── uninstall-desktop-shortcut.sh
├── uninstall-desktop-shortcut.ps1
├── sentinel-icon.svg               # Shortcut icon
└── launchers/
    ├── Launch Sentinel.command     # macOS launcher (bash)
    ├── Launch Sentinel.bat         # Windows launcher (batch)
    ├── launch-sentinel.sh          # Linux launcher (bash)
    └── sentinel.desktop.template   # Linux .desktop template
```
