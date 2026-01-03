// Application configuration types

// Auth config kept for future browser-based login (MSAL)
export interface AuthConfig {
  clientId: string;
  tenantId: string;
  // Future: authMethod: "apiKey" | "browser";
}

export interface SpeechConfig {
  subscriptionKey: string; // API key from Azure Portal
  region: string;
  language: string;
  // resourceId kept for future Entra ID auth
  resourceId?: string;
}

export type OpenAIProvider = "azure" | "openai";

export interface OpenAIConfig {
  provider: OpenAIProvider;
  apiKey: string;
  // Azure-specific
  endpoint?: string; // Azure endpoint URL
  deploymentName?: string; // Azure deployment name
  // OpenAI-specific
  model?: string; // OpenAI model name (e.g., "gpt-4.1", "gpt-4.1-nano")
}

export interface HotkeyConfig {
  accelerator: string; // Electron accelerator format, e.g., "Ctrl+Shift+Space"
}

// Paste mode options:
// - "paste": Use clipboard + Ctrl/Cmd+V to paste the whole thing
// - "type": Type text character by character (slower but some apps prefer it)
// - "clipboard": Just copy to clipboard, don't paste
export type PasteMode = "paste" | "type" | "clipboard";

export interface PreferencesConfig {
  playAudioFeedback: boolean;
  startAtLogin: boolean;
  pasteMode: PasteMode;
  enableOpenAICleanup: boolean;
}

export interface AppConfig {
  auth: AuthConfig;
  speech: SpeechConfig;
  openai: OpenAIConfig;
  hotkey: HotkeyConfig;
  preferences: PreferencesConfig;
}

// Application state types

export type AppState = "idle" | "recording" | "processing";

export interface AuthStatus {
  isAuthenticated: boolean;
  accountName?: string;
  accountEmail?: string;
}

// IPC channel constants

export const IPC_CHANNELS = {
  // Auth
  AUTH_SIGN_IN: "auth:sign-in",
  AUTH_SIGN_OUT: "auth:sign-out",
  AUTH_GET_STATUS: "auth:get-status",
  AUTH_STATUS_CHANGED: "auth:status-changed",

  // Config
  CONFIG_GET: "config:get",
  CONFIG_SET: "config:set",
  CONFIG_GET_ALL: "config:get-all",

  // Speech (renderer <-> main)
  SPEECH_START: "speech:start",
  SPEECH_STOP: "speech:stop",
  SPEECH_READY: "speech:ready",
  SPEECH_STARTED: "speech:started",
  SPEECH_PARTIAL: "speech:partial",
  SPEECH_RESULT: "speech:result",
  SPEECH_ERROR: "speech:error",

  // Overlay
  OVERLAY_STATE: "overlay:state",
  OVERLAY_HIDE: "overlay:hide",

  // Status
  STATUS_CHANGED: "status:changed",
  STATUS_ERROR: "status:error",

  // Sound
  SOUND_PLAY: "sound:play",
} as const;
