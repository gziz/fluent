import { Tray, Menu, nativeImage, app, BrowserWindow } from "electron";
import * as path from "path";
import type { AppState, AuthStatus } from "../shared/types";

export interface TrayCallbacks {
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onOpenLogs: () => void;
  onQuit: () => void;
}

export class TrayManager {
  private tray: Tray | null = null;
  private callbacks: TrayCallbacks;
  private currentState: AppState = "idle";
  private authStatus: AuthStatus = { isAuthenticated: false };

  constructor(callbacks: TrayCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Create the system tray icon
   */
  create(): void {
    // Create a simple colored icon programmatically
    // In production, you'd use actual icon files
    const icon = this.createIcon(this.currentState);
    this.tray = new Tray(icon);
    this.tray.setToolTip("My Whisper - Press Ctrl+Shift+Space to dictate");
    this.updateContextMenu();
  }

  /**
   * Update the tray icon to reflect current state
   */
  setState(state: AppState): void {
    this.currentState = state;
    if (this.tray) {
      this.tray.setImage(this.createIcon(state));
      this.updateTooltip();
    }
  }

  /**
   * Update auth status for menu display
   */
  setAuthStatus(status: AuthStatus): void {
    this.authStatus = status;
    this.updateContextMenu();
  }

  /**
   * Destroy the tray icon
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  private updateTooltip(): void {
    if (!this.tray) return;

    let tooltip = "My Whisper";
    switch (this.currentState) {
      case "idle":
        tooltip += " - Press Ctrl+Shift+Space to dictate";
        break;
      case "recording":
        tooltip += " - Recording... Press again to stop";
        break;
      case "processing":
        tooltip += " - Processing...";
        break;
    }
    this.tray.setToolTip(tooltip);
  }

  private updateContextMenu(): void {
    if (!this.tray) return;

    const menuItems: Electron.MenuItemConstructorOptions[] = [];

    // Status item
    if (this.authStatus.isAuthenticated) {
      menuItems.push({
        label: `Signed in as ${this.authStatus.accountEmail || this.authStatus.accountName || "User"}`,
        enabled: false,
      });
      menuItems.push({ type: "separator" });
    }

    // State indicator
    let stateLabel = "Ready";
    if (this.currentState === "recording") {
      stateLabel = "🔴 Recording...";
    } else if (this.currentState === "processing") {
      stateLabel = "⏳ Processing...";
    }
    menuItems.push({
      label: stateLabel,
      enabled: false,
    });
    menuItems.push({ type: "separator" });

    // Hotkey reminder
    menuItems.push({
      label: "Hotkey: Ctrl+Shift+Space",
      enabled: false,
    });
    menuItems.push({ type: "separator" });

    // Auth actions
    if (this.authStatus.isAuthenticated) {
      menuItems.push({
        label: "Sign Out",
        click: () => this.callbacks.onSignOut(),
      });
    } else {
      menuItems.push({
        label: "Sign In",
        click: () => this.callbacks.onSignIn(),
      });
    }

    menuItems.push({ type: "separator" });

    // Settings
    menuItems.push({
      label: "Settings...",
      click: () => this.callbacks.onOpenSettings(),
    });

    menuItems.push({ type: "separator" });

    // Quit
    menuItems.push({
      label: "Quit",
      click: () => this.callbacks.onQuit(),
    });

    const menu = Menu.buildFromTemplate(menuItems);
    this.tray.setContextMenu(menu);
  }

  /**
   * Create a simple colored icon based on state
   * In production, use actual PNG/ICO files from assets/icons/
   */
  private createIcon(state: AppState): Electron.NativeImage {
    // Create a 16x16 icon with different colors based on state
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4); // RGBA

    let r = 100, g = 100, b = 100; // Default gray (idle)

    if (state === "recording") {
      r = 255; g = 50; b = 50; // Red
    } else if (state === "processing") {
      r = 255; g = 200; b = 50; // Yellow/Orange
    }

    // Fill with solid color (simple circle would be better, but this works)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        // Create a simple circle
        const dx = x - size / 2;
        const dy = y - size / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < size / 2 - 1) {
          canvas[idx] = r;     // R
          canvas[idx + 1] = g; // G
          canvas[idx + 2] = b; // B
          canvas[idx + 3] = 255; // A
        } else {
          canvas[idx] = 0;
          canvas[idx + 1] = 0;
          canvas[idx + 2] = 0;
          canvas[idx + 3] = 0; // Transparent
        }
      }
    }

    return nativeImage.createFromBuffer(canvas, {
      width: size,
      height: size,
    });
  }
}
