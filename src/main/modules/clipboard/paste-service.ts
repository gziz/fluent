import { clipboard } from "electron";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class PasteService {
  private restoreClipboard: boolean;

  constructor(restoreClipboard: boolean = true) {
    this.restoreClipboard = restoreClipboard;
  }

  /**
   * Paste text into the currently active application
   * Uses clipboard + simulated Ctrl+V via PowerShell
   */
  async pasteText(text: string): Promise<void> {
    if (!text) {
      return;
    }

    // Save current clipboard content if we want to restore it
    let previousClipboard: string | null = null;
    if (this.restoreClipboard) {
      try {
        previousClipboard = clipboard.readText();
      } catch {
        // Ignore errors reading clipboard
      }
    }

    // Write text to clipboard
    clipboard.writeText(text);

    // Small delay to ensure clipboard is ready
    await this.delay(50);

    // Simulate Ctrl+V using PowerShell SendKeys
    // This is more reliable than robotjs and doesn't require native modules
    try {
      await this.sendCtrlV();
    } catch (error) {
      console.error("[Paste] Failed to send Ctrl+V:", error);
      // Text is still in clipboard, user can paste manually
    }

    // Restore previous clipboard content after a delay
    if (this.restoreClipboard && previousClipboard !== null) {
      await this.delay(500);
      try {
        clipboard.writeText(previousClipboard);
      } catch {
        // Ignore errors restoring clipboard
      }
    }
  }

  /**
   * Send Ctrl+V keystroke using PowerShell on Windows
   */
  private async sendCtrlV(): Promise<void> {
    if (process.platform === "win32") {
      // Use PowerShell's SendKeys to simulate Ctrl+V
      // ^v means Ctrl+V in SendKeys notation
      const command = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`;
      await execAsync(command);
    } else if (process.platform === "darwin") {
      // macOS: use osascript to simulate Cmd+V
      const command = `osascript -e 'tell application "System Events" to keystroke "v" using command down'`;
      await execAsync(command);
    } else {
      // Linux: use xdotool if available
      const command = `xdotool key ctrl+v`;
      await execAsync(command);
    }
  }

  /**
   * Update restore clipboard preference
   */
  setRestoreClipboard(restore: boolean): void {
    this.restoreClipboard = restore;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
