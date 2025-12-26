import { app, globalShortcut, dialog, BrowserWindow, ipcMain, Notification, screen } from "electron";
import * as path from "path";
import { ConfigStore } from "./modules/config/config-store";
import { AuthService } from "./modules/auth/auth-service";
import { OpenAIService } from "./modules/openai/openai-service";
import { PasteService } from "./modules/clipboard/paste-service";
import { SoundService } from "./modules/sound/sound-service";
import { TrayManager } from "./tray";
import type { AppState } from "../shared/types";
import { IPC_CHANNELS } from "../shared/types";

export class App {
  private configStore: ConfigStore;
  private authService: AuthService;
  private openaiService: OpenAIService;
  private pasteService: PasteService;
  private soundService: SoundService;
  private trayManager: TrayManager;
  private settingsWindow: BrowserWindow | null = null;
  private recorderWindow: BrowserWindow | null = null;
  private overlayWindow: BrowserWindow | null = null;
  private recorderReady = false;
  private pendingRecognitionResolve: ((text: string) => void) | null = null;
  private pendingRecognitionReject: ((error: Error) => void) | null = null;

  private state: AppState = "idle";

  constructor() {
    this.configStore = new ConfigStore();

    const authConfig = this.configStore.get("auth");
    const openaiConfig = this.configStore.get("openai");
    const preferencesConfig = this.configStore.get("preferences");

    this.authService = new AuthService(authConfig);
    this.authService.setApiKeysConfigured(this.configStore.isConfigured());
    this.openaiService = new OpenAIService(openaiConfig);
    this.pasteService = new PasteService(preferencesConfig.useDirectTyping);
    this.soundService = new SoundService();

    this.trayManager = new TrayManager({
      onSignIn: () => this.handleSignIn(),
      onSignOut: () => this.handleSignOut(),
      onOpenSettings: () => this.openSettings(),
      onOpenLogs: () => this.openLogs(),
      onQuit: () => this.quit(),
    });
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    // Create system tray
    this.trayManager.create();

    // Update auth status in tray
    const authStatus = await this.authService.getStatus();
    this.trayManager.setAuthStatus(authStatus);

    // Register global hotkey
    this.registerHotkey();

    // Setup IPC handlers for settings window and recorder
    this.setupIpcHandlers();

    // Create hidden recorder window for speech recognition
    this.createRecorderWindow();

    // Create overlay window (hidden initially)
    this.createOverlayWindow();

    // Check if app is configured
    if (!this.configStore.isConfigured()) {
      this.showConfigurationPrompt();
    }

    // Apply start at login setting
    const preferencesConfig = this.configStore.get("preferences");
    this.applyStartAtLogin(preferencesConfig.startAtLogin);

    console.log("[App] Initialized");
  }

  /**
   * Create overlay bubble window
   */
  private createOverlayWindow(): void {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width } = primaryDisplay.workAreaSize;

    this.overlayWindow = new BrowserWindow({
      width: 220,
      height: 50,
      x: width - 240,
      y: 20,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: path.join(__dirname, "../preload/preload.js"),
      },
    });

    this.overlayWindow.loadFile(
      path.join(__dirname, "../../src/renderer/overlay.html")
    );

    // Prevent closing, just hide
    this.overlayWindow.on("close", (e) => {
      e.preventDefault();
      this.overlayWindow?.hide();
    });
  }

  /**
   * Show overlay with a specific state
   */
  private showOverlay(state: "recording" | "processing" | "done", partialText?: string): void {
    if (this.overlayWindow) {
      // Position overlay on the display where the mouse cursor is
      const cursorPoint = screen.getCursorScreenPoint();
      const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
      const { x, y, width } = currentDisplay.workArea;
      
      // Position at top-right corner of the current display
      this.overlayWindow.setPosition(x + width - 240, y + 20);
      
      this.overlayWindow.webContents.send(IPC_CHANNELS.OVERLAY_STATE, state, partialText);
      if (!this.overlayWindow.isVisible()) {
        this.overlayWindow.showInactive();
      }
    }
  }

  /**
   * Hide overlay
   */
  private hideOverlay(): void {
    if (this.overlayWindow && this.overlayWindow.isVisible()) {
      this.overlayWindow.hide();
    }
  }

  /**
   * Create hidden window for speech recognition (needs Web Audio API)
   */
  private createRecorderWindow(): void {
    this.recorderWindow = new BrowserWindow({
      width: 400,
      height: 300,
      show: false, // Hidden - runs in background
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        sandbox: false,
        preload: path.join(__dirname, "../preload/preload.js"),
      },
    });

    this.recorderWindow.loadFile(
      path.join(__dirname, "../../src/renderer/recorder.html")
    );

    // Prevent closing - just hide instead
    this.recorderWindow.on("close", (e) => {
      if (this.recorderWindow) {
        e.preventDefault();
        this.recorderWindow.hide();
      }
    });

    this.recorderWindow.on("closed", () => {
      // If we get here, cleanup any ongoing recording
      if (this.state === "recording") {
        console.log("[App] Recorder window closed during recording - resetting state");
        this.setState("idle");
        this.hideOverlay();
      }
      this.recorderWindow = null;
      this.recorderReady = false;
    });
  }

  /**
   * Register the global hotkey for dictation toggle
   */
  private registerHotkey(): void {
    const hotkeyConfig = this.configStore.get("hotkey");
    const accelerator = hotkeyConfig.accelerator;

    const success = globalShortcut.register(accelerator, () => {
      this.handleHotkeyPress();
    });

    if (success) {
      console.log(`[App] Hotkey registered: ${accelerator}`);
    } else {
      console.error(`[App] Failed to register hotkey: ${accelerator}`);
      dialog.showErrorBox(
        "Hotkey Registration Failed",
        `Could not register hotkey: ${accelerator}\n\nIt may be in use by another application.`
      );
    }
  }

  /**
   * Register ESC key for canceling recording (only during active recording)
   */
  private registerEscapeShortcut(): void {
    const escSuccess = globalShortcut.register("Escape", () => {
      this.handleEscapeKeyPress();
    });

    if (escSuccess) {
      console.log("[App] ESC key registered for canceling recording");
    } else {
      console.log("[App] Failed to register ESC key (may be in use, non-critical)");
    }
  }

  /**
   * Unregister ESC key shortcut
   */
  private unregisterEscapeShortcut(): void {
    globalShortcut.unregister("Escape");
    console.log("[App] ESC key unregistered");
  }

  /**
   * Handle hotkey press - toggle recording
   */
  private async handleHotkeyPress(): Promise<void> {
    console.log(`[App] Hotkey pressed! Current state: ${this.state}`);

    if (this.state === "processing") {
      console.log("[App] Ignoring hotkey - currently processing");
      return;
    }

    if (this.state === "idle") {
      console.log("[App] Starting recording...");
      await this.startRecording();
    } else if (this.state === "recording") {
      console.log("[App] Stopping recording...");
      await this.stopRecordingAndProcess();
    }
  }

  /**
   * Handle ESC key press - cancel recording
   */
  private handleEscapeKeyPress(): void {
    console.log(`[App] ESC key pressed! Current state: ${this.state}`);

    if (this.state === "recording") {
      this.cancelRecording();
    } else {
      console.log("[App] ESC key ignored - not recording");
    }
  }

  /**
   * Start recording
   */
  private async startRecording(): Promise<void> {
    // Check if authenticated
    console.log("[App] Checking authentication status...");
    const isAuthenticated = await this.authService.isAuthenticated();
    if (!isAuthenticated) {
      console.log("[App] Not authenticated, prompting sign in");
      await this.handleSignIn();
      return;
    }
    console.log("[App] Authentication OK");

    // Check if configured
    if (!this.configStore.isConfigured()) {
      console.log("[App] App not configured, showing configuration prompt");
      this.showConfigurationPrompt();
      return;
    }
    console.log("[App] Configuration OK");

    try {
      const startTime = Date.now();
      this.setState("recording");
      this.registerEscapeShortcut();
      this.showOverlay("recording");
      this.soundService.play("recordingStart");
      console.log("[App] State changed to: recording");

      // Get speech config
      const speechConfig = this.configStore.get("speech");

      // Send start command to recorder window
      if (!this.recorderWindow) {
        throw new Error("Recorder window not available");
      }

      console.log("[App] Starting speech recognition via renderer...");
      this.recorderWindow.webContents.send(IPC_CHANNELS.SPEECH_START, {
        subscriptionKey: speechConfig.subscriptionKey,
        region: speechConfig.region,
        language: speechConfig.language,
      });
      console.log(`[App] Speech recognition started (${Date.now() - startTime}ms total)`);
    } catch (error) {
      console.error("[App] Failed to start recording:", error);
      this.setState("idle");
      dialog.showErrorBox(
        "Recording Failed",
        `Could not start recording: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Stop recording and process the transcript
   */
  private async stopRecordingAndProcess(): Promise<void> {
    try {
      this.unregisterEscapeShortcut();
      this.setState("processing");
      this.showOverlay("processing");
      console.log("[App] State changed to: processing");

      // Stop recognition and get transcript via IPC
      console.log("[App] Stopping speech recognition...");
      
      const transcript = await new Promise<string>((resolve, reject) => {
        this.pendingRecognitionResolve = resolve;
        this.pendingRecognitionReject = reject;
        
        // Set timeout in case something goes wrong
        setTimeout(() => {
          if (this.pendingRecognitionResolve) {
            this.pendingRecognitionResolve("");
            this.pendingRecognitionResolve = null;
            this.pendingRecognitionReject = null;
          }
        }, 10000);
        
        if (this.recorderWindow) {
          this.recorderWindow.webContents.send(IPC_CHANNELS.SPEECH_STOP);
        } else {
          resolve("");
        }
      });
      
      console.log(`[App] Raw transcript received: "${transcript}"`);

      if (!transcript.trim()) {
        console.log("[App] No speech detected - returning to idle");
        this.setState("idle");
        this.hideOverlay();
        return;
      }

      // Clean up transcript with OpenAI
      console.log("[App] Sending transcript to OpenAI for cleanup...");
      const cleanedText = await this.openaiService.cleanupTranscript(transcript);
      console.log(`[App] Cleaned text received: "${cleanedText}"`);

      // Insert text (either via clipboard paste or direct typing)
      if (cleanedText.trim()) {
        await this.pasteService.insertText(cleanedText);
        console.log("[App] Text inserted!");
        this.showOverlay("done");
        this.soundService.play("recordingReady");
      } else {
        this.hideOverlay();
      }

      this.setState("idle");
      console.log("[App] State changed to: idle - Ready for next recording");
    } catch (error) {
      console.error("[App] Failed to process recording:", error);
      this.setState("idle");
      this.hideOverlay();
      dialog.showErrorBox(
        "Processing Failed",
        `Could not process recording: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Cancel recording without processing
   */
  private cancelRecording(): void {
    if (this.state !== "recording") {
      console.log("[App] ESC pressed but not recording - ignoring");
      return;
    }

    console.log("[App] Canceling recording...");
    this.unregisterEscapeShortcut();

    // Stop the speech recognition
    if (this.recorderWindow) {
      this.recorderWindow.webContents.send(IPC_CHANNELS.SPEECH_STOP);
    }

    // Clear any pending recognition handlers
    if (this.pendingRecognitionResolve) {
      this.pendingRecognitionResolve = null;
      this.pendingRecognitionReject = null;
    }

    // Reset to idle state
    this.setState("idle");
    this.hideOverlay();
    console.log("[App] Recording canceled - returned to idle");
  }

  /**
   * Update application state
   */
  private setState(state: AppState): void {
    this.state = state;
    this.trayManager.setState(state);
  }

  /**
   * Handle sign in request
   */
  private async handleSignIn(): Promise<void> {
    try {
      console.log("[App] Starting sign in...");
      await this.authService.signIn();
      const status = await this.authService.getStatus();
      this.trayManager.setAuthStatus(status);
      console.log("[App] Sign in successful");
    } catch (error) {
      console.error("[App] Sign in failed:", error);
      dialog.showErrorBox(
        "Sign In Failed",
        `Could not sign in: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle sign out request
   */
  private async handleSignOut(): Promise<void> {
    try {
      await this.authService.signOut();
      const status = await this.authService.getStatus();
      this.trayManager.setAuthStatus(status);
      console.log("[App] Signed out");
    } catch (error) {
      console.error("[App] Sign out failed:", error);
    }
  }

  /**
   * Show configuration prompt
   */
  private showConfigurationPrompt(): void {
    dialog.showMessageBox({
      type: "info",
      title: "Configuration Required",
      message: "My Whisper needs to be configured before use.",
      detail:
        "Please configure your Azure API keys:\n\n" +
        "1. Speech Service API Key\n" +
        "2. Speech Region (e.g., eastus)\n" +
        "3. OpenAI API Key\n" +
        "4. OpenAI Endpoint\n" +
        "5. OpenAI Deployment Name\n\n" +
        "Open Settings from the tray menu to configure.",
      buttons: ["Open Settings", "Later"],
    }).then((result) => {
      if (result.response === 0) {
        this.openSettings();
      }
    });
  }

  /**
   * Open settings window
   */
  private openSettings(): void {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 600,
      height: 800,
      resizable: true,
      minimizable: false,
      maximizable: false,
      title: "My Whisper - Settings",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: path.join(__dirname, "../preload/preload.js"),
      },
    });

    // Load settings HTML from src directory (not compiled)
    this.settingsWindow.loadFile(
      path.join(__dirname, "../../src/renderer/settings.html")
    );

    // Open DevTools for debugging
    this.settingsWindow.webContents.openDevTools();

    this.settingsWindow.on("closed", () => {
      this.settingsWindow = null;
      // Reload config after settings window closes
      this.reloadConfig();
    });
  }

  /**
   * Open logs/app data folder
   */
  private openLogs(): void {
    const { shell } = require("electron");
    const userDataPath = app.getPath("userData");
    shell.openPath(userDataPath);
  }

  /**
   * Apply start at login setting
   */
  private applyStartAtLogin(enabled: boolean): void {
    app.setLoginItemSettings({ openAtLogin: enabled });
    console.log(`[App] Start at login: ${enabled}`);
  }

  /**
   * Reload configuration and update services
   */
  private reloadConfig(): void {
    const authConfig = this.configStore.get("auth");
    const openaiConfig = this.configStore.get("openai");
    const preferencesConfig = this.configStore.get("preferences");

    this.authService.updateConfig(authConfig);
    this.authService.setApiKeysConfigured(this.configStore.isConfigured());
    this.openaiService.updateConfig(openaiConfig);
    this.pasteService.setUseDirectTyping(preferencesConfig.useDirectTyping);
    this.applyStartAtLogin(preferencesConfig.startAtLogin);

    // Update tray auth status
    this.authService.getStatus().then(status => {
      this.trayManager.setAuthStatus(status);
    });

    // Re-register hotkey if changed
    globalShortcut.unregisterAll();
    this.registerHotkey();
  }

  /**
   * Setup IPC handlers for renderer process communication
   */
  private setupIpcHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.CONFIG_GET_ALL, () => {
      return this.configStore.getAll();
    });

    ipcMain.handle(IPC_CHANNELS.CONFIG_SET, (_event, key: string, value: unknown) => {
      this.configStore.set(key as keyof ReturnType<typeof this.configStore.getAll>, value as never);
      return true;
    });

    ipcMain.handle(IPC_CHANNELS.AUTH_GET_STATUS, async () => {
      return this.authService.getStatus();
    });

    ipcMain.handle(IPC_CHANNELS.AUTH_SIGN_IN, async () => {
      await this.handleSignIn();
      return this.authService.getStatus();
    });

    ipcMain.handle(IPC_CHANNELS.AUTH_SIGN_OUT, async () => {
      await this.handleSignOut();
      return this.authService.getStatus();
    });

    // Speech recognition IPC handlers (from recorder window)
    ipcMain.on(IPC_CHANNELS.SPEECH_READY, () => {
      console.log("[App] Recorder window ready");
      this.recorderReady = true;
    });

    ipcMain.on(IPC_CHANNELS.SPEECH_STARTED, () => {
      console.log("[App] Speech recognition started in renderer");
    });

    ipcMain.on(IPC_CHANNELS.SPEECH_PARTIAL, (_event, text: string) => {
      console.log(`[App] Partial: ${text}`);
    });

    ipcMain.on(IPC_CHANNELS.SPEECH_RESULT, (_event, text: string) => {
      console.log(`[App] Speech result: ${text}`);
      if (this.pendingRecognitionResolve) {
        this.pendingRecognitionResolve(text);
        this.pendingRecognitionResolve = null;
        this.pendingRecognitionReject = null;
      }
    });

    ipcMain.on(IPC_CHANNELS.SPEECH_ERROR, (_event, error: string) => {
      console.error(`[App] Speech error: ${error}`);
      if (this.pendingRecognitionReject) {
        this.pendingRecognitionReject(new Error(error));
        this.pendingRecognitionResolve = null;
        this.pendingRecognitionReject = null;
      }
    });

    // Overlay IPC handler
    ipcMain.on(IPC_CHANNELS.OVERLAY_HIDE, () => {
      console.log("[App] Overlay hide requested from renderer");
      this.hideOverlay();
    });
  }

  /**
   * Quit the application
   */
  private quit(): void {
    globalShortcut.unregisterAll();

    // Force destroy windows (bypass close prevention)
    if (this.recorderWindow) {
      this.recorderWindow.removeAllListeners("close");
      this.recorderWindow.close();
    }
    if (this.overlayWindow) {
      this.overlayWindow.removeAllListeners("close");
      this.overlayWindow.close();
    }

    this.trayManager.destroy();
    app.quit();
  }
}
