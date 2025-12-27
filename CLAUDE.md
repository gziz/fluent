# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run dev          # Build and run Electron app
npm start            # Build and run (same as dev)
npm run dist:win     # Build Windows installer to release/
```

## Architecture

**My Whisper** is an Electron desktop app for voice-to-text dictation using Azure Speech SDK and Azure OpenAI.

### Process Model

- **Main process** (`src/main/`): Orchestrates the app via `App` class in `app.ts`
- **Renderer processes** (`src/renderer/`): HTML files loaded by BrowserWindow
  - `recorder.html` - Hidden window for Web Audio API / Speech SDK
  - `settings.html` - Configuration UI
  - `overlay.html` - Recording status bubble
- **Preload** (`src/preload/preload.ts`): Exposes IPC bridge to renderer

### Main Process Modules (`src/main/modules/`)

| Module | Purpose |
|--------|---------|
| `auth/auth-service.ts` | Microsoft Entra ID authentication via MSAL |
| `auth/token-cache.ts` | Persists auth tokens |
| `config/config-store.ts` | JSON config storage in userData |
| `speech/speech-service.ts` | Azure Speech SDK wrapper |
| `openai/openai-service.ts` | Transcript cleanup via Azure OpenAI |
| `clipboard/paste-service.ts` | Text insertion with multiple paste modes |
| `sound/sound-service.ts` | Cross-platform audio feedback playback |

### IPC Communication

All IPC channels are defined in `src/shared/types.ts` under `IPC_CHANNELS`. Main patterns:
- `ipcMain.handle()` for request/response (config, auth)
- `ipcMain.on()` + `webContents.send()` for events (speech recognition flow)

### App State Machine

Located in `App` class (`src/main/app.ts`):
- `idle` → (hotkey) → `recording` → (hotkey) → `processing` → `idle`
- ESC cancels recording and returns to idle
- Global shortcut: `Ctrl+Shift+Space` (configurable)

### Configuration

`ConfigStore` persists to `config.json` in Electron's userData. Shape defined in `src/shared/types.ts`:
- `auth`: clientId, tenantId
- `speech`: subscriptionKey, region, language
- `openai`: endpoint, deploymentName, transcriptionDeploymentName, apiKey
- `hotkey`: accelerator string
- `preferences`: playAudioFeedback, startAtLogin, pasteMode

#### Paste Modes

The `pasteMode` preference controls how transcribed text is inserted:
- `paste` - Copy to clipboard and simulate Ctrl/Cmd+V (default, fastest)
- `type` - Type text character-by-character via OS shell commands (slower, works in more apps)
- `clipboard` - Copy to clipboard only, no automatic paste

## Key Patterns

- Speech SDK requires browser globals polyfilled in `index.ts` before import
- Recorder window stays hidden - uses Web Audio API unavailable in main process
- Overlay window uses `showInactive()` to avoid stealing focus
- Single instance lock prevents multiple app instances
- Sound playback uses renderer process for instant feedback, with macOS `afplay` fallback
- Paste service uses platform-specific shell commands (osascript, PowerShell, xdotool) for text insertion
