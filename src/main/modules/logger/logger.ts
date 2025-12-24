import * as fs from "fs";
import * as path from "path";
import { app, shell } from "electron";

class Logger {
  private logPath: string;
  private logsDir: string;
  private initialized = false;

  constructor() {
    // Will be set properly when init() is called after app is ready
    this.logsDir = "";
    this.logPath = "";
  }

  /**
   * Initialize logger after app is ready
   */
  init(): void {
    if (this.initialized) return;

    this.logsDir = app.getPath("logs");

    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.logPath = path.join(this.logsDir, `my-whisper-${timestamp}.log`);

    this.initialized = true;
    this.log("[Logger]", "Initialized, writing to:", this.logPath);

    // Clean up old log files (keep last 10)
    this.cleanupOldLogs();
  }

  /**
   * Log a message to console and file
   */
  log(prefix: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const message = `${timestamp} ${prefix} ${args.map(a =>
      typeof a === "object" ? JSON.stringify(a) : String(a)
    ).join(" ")}`;

    // Always log to console
    console.log(message);

    // Write to file if initialized
    if (this.initialized && this.logPath) {
      try {
        fs.appendFileSync(this.logPath, message + "\n");
      } catch (error) {
        console.error("Failed to write to log file:", error);
      }
    }
  }

  /**
   * Log an error
   */
  error(prefix: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const message = `${timestamp} ${prefix} ERROR: ${args.map(a =>
      a instanceof Error ? `${a.message}\n${a.stack}` :
      typeof a === "object" ? JSON.stringify(a) : String(a)
    ).join(" ")}`;

    console.error(message);

    if (this.initialized && this.logPath) {
      try {
        fs.appendFileSync(this.logPath, message + "\n");
      } catch (error) {
        console.error("Failed to write to log file:", error);
      }
    }
  }

  /**
   * Get the current log file path
   */
  getLogPath(): string {
    return this.logPath;
  }

  /**
   * Get the logs directory
   */
  getLogsDir(): string {
    return this.logsDir;
  }

  /**
   * Open the logs folder in file explorer
   */
  openLogsFolder(): void {
    if (this.logsDir) {
      shell.openPath(this.logsDir);
    }
  }

  /**
   * Clean up old log files, keeping only the most recent ones
   */
  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logsDir)
        .filter(f => f.startsWith("my-whisper-") && f.endsWith(".log"))
        .map(f => ({
          name: f,
          path: path.join(this.logsDir, f),
          mtime: fs.statSync(path.join(this.logsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Keep only the 10 most recent log files
      const toDelete = files.slice(10);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
        this.log("[Logger]", "Deleted old log file:", file.name);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

export const logger = new Logger();
