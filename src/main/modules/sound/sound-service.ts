import { exec } from "child_process";

export type SoundEvent = "recordingStart" | "recordingReady";

// Map events to sounds - easy to customize later
const SOUND_MAP: Record<SoundEvent, { type: "system" | "custom"; name: string }> = {
  recordingStart: { type: "system", name: "Ping" },
  recordingReady: { type: "system", name: "Glass" },
};

// Available macOS system sounds for reference:
// Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink

export class SoundService {
  private enabled: boolean = true;

  /**
   * Play a sound for a specific event
   */
  play(event: SoundEvent): void {
    if (!this.enabled) return;

    const sound = SOUND_MAP[event];
    
    if (sound.type === "system") {
      this.playSystemSound(sound.name);
    } else {
      this.playCustomSound(sound.name);
    }
  }

  /**
   * Play a macOS system sound
   */
  private playSystemSound(name: string): void {
    const soundPath = `/System/Library/Sounds/${name}.aiff`;
    exec(`afplay "${soundPath}"`, (error) => {
      if (error) {
        console.error(`[SoundService] Failed to play system sound: ${name}`, error);
      }
    });
  }

  /**
   * Play a custom sound file (for future use)
   * Sound files should be placed in src/renderer/sounds/
   */
  private playCustomSound(filename: string): void {
    // TODO: Implement custom sound playback
    // Options:
    // 1. Use afplay with path to bundled sound file
    // 2. Play through a hidden BrowserWindow with Web Audio API
    console.log(`[SoundService] Custom sound not yet implemented: ${filename}`);
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
