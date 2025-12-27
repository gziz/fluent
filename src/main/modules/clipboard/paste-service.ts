import { clipboard } from "electron";
import { exec } from "child_process";
import { promisify } from "util";
import type { PasteMode } from "../../../shared/types";

const execAsync = promisify(exec);

export class PasteService {
  private pasteMode: PasteMode;

  constructor(pasteMode: PasteMode = "paste") {
    this.pasteMode = pasteMode;
  }

  /**
   * Insert text based on the current paste mode:
   * - "paste": Copy to clipboard and simulate Ctrl/Cmd+V
   * - "type": Copy to clipboard and type character by character
   * - "clipboard": Just copy to clipboard, don't paste
   */
  async insertText(text: string): Promise<void> {
    if (!text) {
      return;
    }

    switch (this.pasteMode) {
      case "type":
        await this.typeText(text);
        break;
      case "clipboard":
        await this.copyToClipboard(text);
        break;
      case "paste":
      default:
        await this.pasteText(text);
        break;
    }
  }

  /**
   * Copy text to clipboard without pasting
   */
  async copyToClipboard(text: string): Promise<void> {
    if (!text) {
      return;
    }
    clipboard.writeText(text);
    console.log("[Paste] Text copied to clipboard (no paste)");
  }

  /**
   * Type text directly using platform-specific shell commands
   * Note: This is slower than clipboard paste for long text
   */
  async typeText(text: string): Promise<void> {
    if (!text) {
      return;
    }

    // Always save to clipboard so user can paste later if needed
    clipboard.writeText(text);

    try {
      if (process.platform === "darwin") {
        await this.typeTextMacOS(text);
      } else if (process.platform === "win32") {
        await this.typeTextWindows(text);
      } else {
        await this.typeTextLinux(text);
      }
    } catch (error) {
      console.error("[Paste] Failed to type text:", error);
      // Text is already in clipboard, user can paste manually
    }
  }

  /**
   * Type text on macOS using osascript
   * Handles newlines by typing each segment and pressing return between them
   */
  private async typeTextMacOS(text: string): Promise<void> {
    const segments = text.split("\n");
    for (let i = 0; i < segments.length; i++) {
      if (segments[i]) {
        const escaped = this.escapeAppleScript(segments[i]);
        await execAsync(
          `osascript -e 'tell application "System Events" to keystroke "${escaped}"'`
        );
      }
      if (i < segments.length - 1) {
        // Press Return for newline
        await execAsync(
          `osascript -e 'tell application "System Events" to keystroke return'`
        );
      }
    }
  }

  /**
   * Type text on Windows using PowerShell SendKeys
   */
  private async typeTextWindows(text: string): Promise<void> {
    const escaped = this.escapeSendKeys(text);
    const command = `powershell -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${escaped}')"`;
    await execAsync(command);
  }

  /**
   * Type text on Linux using xdotool
   */
  private async typeTextLinux(text: string): Promise<void> {
    const escaped = this.escapeShell(text);
    const command = `xdotool type -- "${escaped}"`;
    await execAsync(command);
  }

  /**
   * Escape special characters for AppleScript keystroke
   */
  private escapeAppleScript(text: string): string {
    return text
      .replace(/\\/g, "\\\\") // Backslash
      .replace(/"/g, '\\"'); // Double quote
  }

  /**
   * Escape special characters for PowerShell SendKeys
   * Special chars: + ^ % ~ ( ) { } [ ]
   */
  private escapeSendKeys(text: string): string {
    return text
      .replace(/'/g, "''") // Escape single quotes for PowerShell string
      .replace(/\+/g, "{+}") // Plus
      .replace(/\^/g, "{^}") // Caret
      .replace(/%/g, "{%}") // Percent
      .replace(/~/g, "{~}") // Tilde
      .replace(/\(/g, "{(}") // Open paren
      .replace(/\)/g, "{)}") // Close paren
      .replace(/\{/g, "{{}") // Open brace
      .replace(/\}/g, "{}}") // Close brace
      .replace(/\[/g, "{[}") // Open bracket
      .replace(/\]/g, "{]}") // Close bracket
      .replace(/\n/g, "{ENTER}"); // Newline
  }

  /**
   * Escape special characters for shell (Linux xdotool)
   */
  private escapeShell(text: string): string {
    return text
      .replace(/\\/g, "\\\\") // Backslash
      .replace(/"/g, '\\"') // Double quote
      .replace(/\$/g, "\\$") // Dollar sign
      .replace(/`/g, "\\`"); // Backtick
  }

  /**
   * Paste text into the currently active application
   * Uses clipboard + simulated Ctrl+V
   */
  async pasteText(text: string): Promise<void> {
    if (!text) {
      return;
    }

    // Write text to clipboard
    clipboard.writeText(text);

    // Small delay to ensure clipboard is ready
    await this.delay(50);

    // Simulate Ctrl+V / Cmd+V
    try {
      await this.sendCtrlV();
    } catch (error) {
      console.error("[Paste] Failed to send Ctrl+V:", error);
      // Text is still in clipboard, user can paste manually
    }
  }

  /**
   * Send Ctrl+V keystroke using PowerShell on Windows
   */
  private async sendCtrlV(): Promise<void> {
    if (process.platform === "win32") {
      // Use PowerShell with WScript.Shell SendKeys - more reliable for Ctrl+V
      // Using {^v} doesn't work, we need to use key down/up approach
      const command = `powershell -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('^v')"`;
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
   * Update paste mode preference
   */
  setPasteMode(pasteMode: PasteMode): void {
    this.pasteMode = pasteMode;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
