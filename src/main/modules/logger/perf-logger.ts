import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

/**
 * A single timing entry within a dictation session.
 */
interface PerfEntry {
  label: string;
  startMs: number; // offset from session start
  endMs: number; // offset from session start
  durationMs: number;
}

/**
 * A complete dictation session with all timing breakdowns.
 */
interface PerfSession {
  sessionId: string;
  timestamp: string;
  entries: PerfEntry[];
  totalMs: number;
  rawTranscriptLength: number;
  cleanedTranscriptLength: number;
  openAIEnabled: boolean;
  /** Extra metadata from preload (SDK init times, etc.) */
  preloadTimings?: Record<string, number>;
}

/**
 * Performance logger that records timing data for each dictation session
 * to a JSON-lines file for later analysis.
 *
 * Usage:
 *   perfLogger.startSession();
 *   perfLogger.markStart("stop-recognition");
 *   // ... do work ...
 *   perfLogger.markEnd("stop-recognition");
 *   perfLogger.endSession({ rawLen: 42, cleanedLen: 40, openAI: true });
 *
 * Each line in the output file is a self-contained JSON object.
 */
class PerfLogger {
  private logPath = "";
  private initialized = false;

  // Current session tracking
  private sessionStart = 0;
  private marks: Map<string, number> = new Map();
  private entries: PerfEntry[] = [];
  private sessionId = "";
  private preloadTimings: Record<string, number> = {};

  /**
   * Initialize after app is ready (needs userData path).
   */
  init(): void {
    if (this.initialized) return;

    const logsDir = app.getPath("logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logPath = path.join(logsDir, "perf.jsonl");
    this.initialized = true;
    console.log(`[PerfLogger] Writing to ${this.logPath}`);
  }

  /**
   * Begin a new dictation session. Resets all marks.
   */
  startSession(): void {
    this.sessionStart = Date.now();
    this.sessionId = `sess_${this.sessionStart}`;
    this.marks.clear();
    this.entries = [];
    this.preloadTimings = {};
  }

  /**
   * Record the start of a named span.
   */
  markStart(label: string): void {
    this.marks.set(label, Date.now());
  }

  /**
   * Record the end of a named span (must have a matching markStart).
   */
  markEnd(label: string): void {
    const start = this.marks.get(label);
    if (start === undefined) {
      console.warn(`[PerfLogger] markEnd("${label}") called without markStart`);
      return;
    }
    const end = Date.now();
    this.entries.push({
      label,
      startMs: start - this.sessionStart,
      endMs: end - this.sessionStart,
      durationMs: end - start,
    });
    this.marks.delete(label);
  }

  /**
   * Attach timing data that originated in the preload/renderer process.
   */
  setPreloadTimings(timings: Record<string, number>): void {
    this.preloadTimings = timings;
  }

  /**
   * Finish the session and write the record to the perf log file.
   */
  endSession(meta: {
    rawTranscriptLength: number;
    cleanedTranscriptLength: number;
    openAIEnabled: boolean;
  }): void {
    if (!this.initialized) {
      console.warn("[PerfLogger] Not initialized – skipping write");
      return;
    }

    const totalMs = Date.now() - this.sessionStart;

    const session: PerfSession = {
      sessionId: this.sessionId,
      timestamp: new Date(this.sessionStart).toISOString(),
      entries: this.entries,
      totalMs,
      rawTranscriptLength: meta.rawTranscriptLength,
      cleanedTranscriptLength: meta.cleanedTranscriptLength,
      openAIEnabled: meta.openAIEnabled,
      ...(Object.keys(this.preloadTimings).length > 0 && {
        preloadTimings: this.preloadTimings,
      }),
    };

    try {
      fs.appendFileSync(this.logPath, JSON.stringify(session) + "\n");
      console.log(`[PerfLogger] Session ${this.sessionId} written (${totalMs}ms total)`);
    } catch (error) {
      console.error("[PerfLogger] Failed to write:", error);
    }

    // Print a human-readable summary to console too
    this.printSummary(session);
  }

  /**
   * Get the path to the performance log file.
   */
  getLogPath(): string {
    return this.logPath;
  }

  private printSummary(session: PerfSession): void {
    const bar = "═".repeat(50);
    console.log(`[Perf] ${bar}`);
    console.log(`[Perf] SESSION ${session.sessionId}`);
    console.log(`[Perf] ${"-".repeat(50)}`);

    if (session.preloadTimings && Object.keys(session.preloadTimings).length > 0) {
      console.log(`[Perf]   Preload timings:`);
      for (const [k, v] of Object.entries(session.preloadTimings)) {
        console.log(`[Perf]     • ${k}: ${v}ms`);
      }
    }

    for (const entry of session.entries) {
      const pad = entry.label.length < 30
        ? " ".repeat(30 - entry.label.length)
        : " ";
      console.log(`[Perf]   • ${entry.label}${pad}${entry.durationMs}ms`);
    }

    console.log(`[Perf]   ${"-".repeat(50)}`);
    console.log(`[Perf]   TOTAL: ${session.totalMs}ms`);
    console.log(`[Perf]   Transcript: ${session.rawTranscriptLength} chars raw → ${session.cleanedTranscriptLength} chars cleaned`);
    console.log(`[Perf] ${bar}`);
  }
}

export const perfLogger = new PerfLogger();
