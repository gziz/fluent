import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

/**
 * A single transcript entry saved after each dictation session.
 */
export interface TranscriptEntry {
  /** Unique ID for this entry */
  id: string;
  /** ISO-8601 timestamp of when the dictation occurred */
  timestamp: string;
  /** Raw ASR text from Azure Speech SDK */
  rawTranscript: string;
  /** Cleaned text after OpenAI processing (same as raw if cleanup was disabled) */
  cleanedTranscript: string;
  /** Whether OpenAI cleanup was applied */
  openAICleanupApplied: boolean;
  /** Description of the cleanup model used (e.g. "Azure OpenAI / gpt-4o", "openai.com / gpt-4.1-nano") or null if cleanup was disabled */
  cleanupModel: string | null;
  /** Speech recognition language used */
  language: string;
  /** Duration of the recording in milliseconds (from start to stop hotkey press) */
  recordingDurationMs: number;
}

/**
 * Stores dictation transcripts locally as a JSON-lines (.jsonl) file
 * in the Electron userData directory.
 *
 * Each line in the file is a self-contained JSON object representing
 * one dictation session.
 */
export class TranscriptStore {
  private storePath = "";
  private initialized = false;

  /**
   * Initialize after app is ready (needs userData path).
   */
  init(): void {
    if (this.initialized) return;

    const userDataDir = app.getPath("userData");
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    this.storePath = path.join(userDataDir, "transcripts.jsonl");
    this.initialized = true;
    console.log(`[TranscriptStore] Storing transcripts at ${this.storePath}`);
  }

  /**
   * Save a transcript entry to the store.
   */
  save(entry: Omit<TranscriptEntry, "id" | "timestamp">): TranscriptEntry {
    if (!this.initialized) {
      this.init();
    }

    const fullEntry: TranscriptEntry = {
      id: `tr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    try {
      fs.appendFileSync(this.storePath, JSON.stringify(fullEntry) + "\n", "utf-8");
      console.log(`[TranscriptStore] Saved transcript ${fullEntry.id} (${fullEntry.rawTranscript.length} chars raw, ${fullEntry.cleanedTranscript.length} chars cleaned)`);
    } catch (error) {
      console.error("[TranscriptStore] Failed to save transcript:", error);
    }

    return fullEntry;
  }

  /**
   * Read all stored transcripts, most recent first.
   */
  getAll(): TranscriptEntry[] {
    if (!this.initialized) {
      this.init();
    }

    try {
      if (!fs.existsSync(this.storePath)) {
        return [];
      }

      const data = fs.readFileSync(this.storePath, "utf-8");
      const entries: TranscriptEntry[] = [];

      for (const line of data.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          entries.push(JSON.parse(trimmed) as TranscriptEntry);
        } catch {
          console.warn("[TranscriptStore] Skipping malformed line");
        }
      }

      // Return most recent first
      return entries.reverse();
    } catch (error) {
      console.error("[TranscriptStore] Failed to read transcripts:", error);
      return [];
    }
  }

  /**
   * Get the most recent N transcripts.
   */
  getRecent(count: number): TranscriptEntry[] {
    return this.getAll().slice(0, count);
  }

  /**
   * Clear all stored transcripts.
   */
  clear(): void {
    if (!this.initialized) {
      this.init();
    }

    try {
      if (fs.existsSync(this.storePath)) {
        fs.writeFileSync(this.storePath, "", "utf-8");
        console.log("[TranscriptStore] All transcripts cleared");
      }
    } catch (error) {
      console.error("[TranscriptStore] Failed to clear transcripts:", error);
    }
  }

  /**
   * Get the file path where transcripts are stored.
   */
  getStorePath(): string {
    return this.storePath;
  }
}

/** Singleton instance */
export const transcriptStore = new TranscriptStore();
