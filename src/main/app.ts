import { app, globalShortcut, dialog, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { ConfigStore } from "./modules/config/config-store";
import { AuthService } from "./modules/auth/auth-service";
import { SpeechService } from "./modules/speech/speech-service";
import { OpenAIService } from "./modules/openai/openai-service";
import { PasteService } from "./modules/clipboard/paste-service";
import { TrayManager } from "./tray";
import type { AppState } from "../shared/types";
import { IPC_CHANNELS } from "../shared/types";

export class App {
  private configStore: ConfigStore;
  private authService: AuthService;
  private speechService: SpeechService;
  private openaiService: OpenAIService;
  private pasteService: PasteService;
  private trayManager: TrayManager;
  private settingsWindow: BrowserWindow | null = null;

  private state: AppState = "idle";

  constructor() {
    this.configStore = new ConfigStore();

    const authConfig = this.configStore.get("auth");
    const speechConfig = this.configStore.get("speech");
    const openaiConfig = this.configStore.get("openai");
    const preferencesConfig = this.configStore.get("preferences");

    this.authService = new AuthService(authConfig);
    this.speechService = new SpeechService(this.authService, speechConfig);
    this.openaiService = new OpenAIService(this.authService, openaiConfig);
    this.pasteService = new PasteService(preferencesConfig.restoreClipboard);

    this.trayManager = new TrayManager({
      onSignIn: () => this.handleSignIn(),
      onSignOut: () => this.handleSignOut(),
      onOpenSettings: () => this.openSettings(),
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

    // Setup IPC handlers for settings window
    this.setupIpcHandlers();

    // Check if app is configured
    if (!this.configStore.isConfigured()) {
      this.showConfigurationPrompt();
    }

    console.log("[App] Initialized");
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
      this.setState("recording");
      console.log("[App] State changed to: recording");
      console.log("[App] Starting speech recognition...");
      await this.speechService.startRecognition();
      console.log("[App] Speech recognition started - Listening for audio...");
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
      this.setState("processing");
      console.log("[App] State changed to: processing");

      // Stop recognition and get transcript
      console.log("[App] Stopping speech recognition...");
      const transcript = await this.speechService.stopRecognition();
      console.log(`[App] Raw transcript received: "${transcript}"`);

      if (!transcript.trim()) {
        console.log("[App] No speech detected - returning to idle");
        this.setState("idle");
        return;
      }

      // Clean up transcript with OpenAI
      console.log("[App] Sending transcript to OpenAI for cleanup...");
      const cleanedText = await this.openaiService.cleanupTranscript(transcript);
      console.log(`[App] Cleaned text received: "${cleanedText}"`);

      // Paste into active application
      if (cleanedText.trim()) {
        console.log("[App] Pasting text into active application...");
        await this.pasteService.pasteText(cleanedText);
        console.log("[App] Text pasted successfully!");
      }

      this.setState("idle");
      console.log("[App] State changed to: idle - Ready for next recording");
    } catch (error) {
      console.error("[App] Failed to process recording:", error);
      this.setState("idle");
      dialog.showErrorBox(
        "Processing Failed",
        `Could not process recording: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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
        "Please configure your Azure credentials:\n\n" +
        "1. Client ID (from Azure App Registration)\n" +
        "2. Tenant ID (your Azure AD tenant)\n" +
        "3. Speech Resource ID\n" +
        "4. Speech Region\n" +
        "5. OpenAI Endpoint\n" +
        "6. OpenAI Deployment Name\n\n" +
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
      height: 700,
      resizable: false,
      minimizable: false,
      maximizable: false,
      title: "My Whisper - Settings",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "../preload/preload.js"),
      },
    });

    // Load settings HTML from src directory (not compiled)
    this.settingsWindow.loadFile(
      path.join(__dirname, "../../src/renderer/settings.html")
    );

    this.settingsWindow.on("closed", () => {
      this.settingsWindow = null;
      // Reload config after settings window closes
      this.reloadConfig();
    });
  }

  /**
   * Reload configuration and update services
   */
  private reloadConfig(): void {
    const authConfig = this.configStore.get("auth");
    const speechConfig = this.configStore.get("speech");
    const openaiConfig = this.configStore.get("openai");
    const preferencesConfig = this.configStore.get("preferences");

    this.authService.updateConfig(authConfig);
    this.speechService.updateConfig(speechConfig);
    this.openaiService.updateConfig(openaiConfig);
    this.pasteService.setRestoreClipboard(preferencesConfig.restoreClipboard);

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
  }

  /**
   * Quit the application
   */
  private quit(): void {
    globalShortcut.unregisterAll();
    this.trayManager.destroy();
    app.quit();
  }
}
