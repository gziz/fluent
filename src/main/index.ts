import { app } from "electron";
import { App } from "./app";
import { perfLogger } from "./modules/logger/perf-logger";
import { transcriptStore } from "./modules/transcripts/transcript-store";

// Polyfill for Microsoft Speech SDK which expects browser globals
// Must be set before importing the SDK
(global as unknown as { window: typeof globalThis }).window = global;
(global as unknown as { self: typeof globalThis }).self = global;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log("Another instance is already running");
  app.quit();
} else {
  let application: App | null = null;

  app.on("second-instance", () => {
    // Someone tried to run a second instance
    // Could focus settings window here if needed
    console.log("Second instance attempted to start");
  });

  // Quit when all windows are closed, except on macOS
  app.on("window-all-closed", () => {
    // Don't quit on window close - we're a tray app
    // This event doesn't need to be prevented, just don't call app.quit()
  });

  app.on("activate", () => {
    // On macOS, re-create window when dock icon is clicked
  });

  // Initialize app when Electron is ready
  app.whenReady().then(async () => {
    perfLogger.init();
    transcriptStore.init();
    application = new App();
    await application.initialize();
    console.log("My Whisper is ready");
  });

  // Clean up on quit
  app.on("will-quit", () => {
    console.log("My Whisper shutting down");
  });
}
