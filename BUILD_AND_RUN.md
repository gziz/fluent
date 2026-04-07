# Build and Run Guide

## Development Mode

Run the app directly from source (for development/debugging):

```bash
npm start
```

This compiles TypeScript and launches Electron. Changes require restart.

---

## Packaging the App

### Build the packaged app:

```bash
npm run dist:win
```

This creates an unpacked build at `release/win-unpacked/`.

**Note:** The NSIS installer build may fail due to Windows symlink permissions. To fix:
- Enable **Developer Mode** in Windows Settings, OR
- Run terminal as **Administrator**

---

## Running the Packaged App

### Option 1: Double-click in File Explorer
Navigate to `release\win-unpacked\` and double-click `Fluent.exe`

### Option 2: Command Prompt / PowerShell
```cmd
"C:\Users\gemoreno\sources\repos\fluent\release\win-unpacked\Fluent.exe"
```

### Option 3: PowerShell with Start-Process
```powershell
Start-Process ".\release\win-unpacked\Fluent.exe"
```

### Option 4: Windows Run Dialog (Win + R)
Press `Win + R` and enter the full path:
```
C:\Users\gemoreno\sources\repos\fluent\release\win-unpacked\Fluent.exe
```

### Option 5: Create a Desktop Shortcut
1. Right-click on `Fluent.exe`
2. Select "Create shortcut"
3. Move shortcut to Desktop

### Option 6: Pin to Taskbar / Start Menu
1. Right-click on `Fluent.exe`
2. Select "Pin to taskbar" or "Pin to Start"

### Option 7: Add to PATH (run from anywhere)
Add `release\win-unpacked\` to your system PATH, then run:
```cmd
"Fluent.exe"
```

---

## Killing the App

If the app is running in background (system tray):

```bash
taskkill /F /IM "Fluent.exe"
```

Or right-click the tray icon → Quit

---

## Verifying "Start at Login"

After enabling in Settings, verify registration:

### Option 1: Task Manager
1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to "Startup" tab
3. Look for "Fluent"

### Option 2: Registry
Check `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` for the app entry.

### Option 3: Settings App
1. Open Windows Settings
2. Apps → Startup
3. Look for "Fluent"

---

## Troubleshooting

### App won't start
- Check if another instance is running: `tasklist | findstr "Whisper"`
- Kill existing instances: `taskkill /F /IM "Fluent.exe"`

### Hotkey not working
- Another app may be using the same hotkey
- Check Settings to change the hotkey

### Build fails with symlink error
- Enable Developer Mode in Windows Settings
- Or run terminal as Administrator
