import { exec } from "child_process";
import { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../../shared/types";

export type SoundEvent = "recordingStart" | "recordingReady";

// Platform-specific sound mappings
const MAC_SOUNDS: Record<SoundEvent, string> = {
  recordingStart: "/System/Library/Sounds/Ping.aiff",
  recordingReady: "/System/Library/Sounds/Glass.aiff",
};

// Windows sounds from C:\Windows\Media\
const WINDOWS_SOUNDS: Record<SoundEvent, string> = {
  recordingStart: "C:\\Windows\\Media\\Windows Notify.wav",
  recordingReady: "C:\\Windows\\Media\\Windows Notify.wav",
};

export class SoundService {
  private enabled: boolean = true;
  private platform: NodeJS.Platform;
  private rendererWindow: BrowserWindow | null = null;

  constructor() {
    this.platform = process.platform;
  }

  /**
   * Set the renderer window to use for playing sounds (instant playback)
   */
  setRendererWindow(window: BrowserWindow): void {
    this.rendererWindow = window;
  }

  /**
   * Play a sound for a specific event
   */
  play(event: SoundEvent): void {
    if (!this.enabled) return;

    // Skip sound playback on Windows
    if (this.platform === "win32") return;

    const soundPath = this.platform === "darwin"
      ? MAC_SOUNDS[event]
      : WINDOWS_SOUNDS[event];

    if (!soundPath) {
      console.log(`[SoundService] Unsupported platform: ${this.platform}`);
      return;
    }

    // On macOS, use afplay directly (more reliable for system sounds)
    if (this.platform === "darwin") {
      this.playViaMacCommand(soundPath);
    } else if (this.rendererWindow && !this.rendererWindow.isDestroyed()) {
      // On Windows, use renderer for playback
      this.playViaRenderer(soundPath);
    } else {
      console.log("[SoundService] No renderer window available for sound playback");
    }
  }

  /**
   * Play sound via renderer process using HTML5 Audio (instant)
   */
  private playViaRenderer(soundPath: string): void {
    this.rendererWindow?.webContents.send(IPC_CHANNELS.SOUND_PLAY, soundPath);
  }

  /**
   * Play sound via macOS afplay command (fast fallback)
   */
  private playViaMacCommand(soundPath: string): void {
    exec(`afplay "${soundPath}"`, (error) => {
      if (error) {
        console.error(`[SoundService] Failed to play Mac sound:`, error);
      }
    });
  }

  /**
   * Enable or disable sounds
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
