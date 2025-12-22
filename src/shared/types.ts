// Application configuration types

export interface AuthConfig {
  clientId: string;
  tenantId: string;
}

export interface SpeechConfig {
  resourceId: string;
  region: string;
  language: string;
}

export interface OpenAIConfig {
  endpoint: string;
  deploymentName: string;
}

export interface HotkeyConfig {
  accelerator: string; // Electron accelerator format, e.g., "Ctrl+Shift+Space"
}

export interface PreferencesConfig {
  playAudioFeedback: boolean;
  restoreClipboard: boolean;
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

  // Status
  STATUS_CHANGED: "status:changed",
  STATUS_ERROR: "status:error",
} as const;
