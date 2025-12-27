import * as fs from "fs";
import * as path from "path";
import { app, safeStorage } from "electron";
import type { AppConfig } from "../../../shared/types";

// Prefix for encrypted values
const ENCRYPTED_PREFIX = "enc:";

const DEFAULT_CONFIG: AppConfig = {
  auth: {
    clientId: "",
    tenantId: "",
  },
  speech: {
    subscriptionKey: "",
    region: "eastus",
    language: "en-US",
  },
  openai: {
    endpoint: "",
    deploymentName: "gpt-4o-mini",
    transcriptionDeploymentName: "gpt-4o-transcribe",
    apiKey: "",
  },
  hotkey: {
    accelerator: "Ctrl+Shift+Space",
  },
  preferences: {
    playAudioFeedback: true,
    startAtLogin: false,
    pasteMode: "paste",
  },
};

// Fields that should be encrypted
const SENSITIVE_FIELDS = [
  "speech.subscriptionKey",
  "openai.apiKey",
] as const;

export class ConfigStore {
  private configPath: string;
  private config: AppConfig;
  private encryptionAvailable: boolean;

  constructor() {
    this.configPath = path.join(app.getPath("userData"), "config.json");
    this.encryptionAvailable = safeStorage.isEncryptionAvailable();

    if (!this.encryptionAvailable) {
      console.warn("[Config] Encryption not available - API keys will be stored in plain text");
    }

    this.config = this.load();
  }

  /**
   * Encrypt a string value if encryption is available
   */
  private encrypt(value: string): string {
    if (!value || !this.encryptionAvailable) {
      return value;
    }
    try {
      const encrypted = safeStorage.encryptString(value);
      return ENCRYPTED_PREFIX + encrypted.toString("base64");
    } catch (error) {
      console.error("[Config] Failed to encrypt value:", error);
      return value;
    }
  }

  /**
   * Decrypt a string value if it's encrypted
   */
  private decrypt(value: string): string {
    if (!value || !value.startsWith(ENCRYPTED_PREFIX)) {
      return value;
    }
    if (!this.encryptionAvailable) {
      console.warn("[Config] Cannot decrypt - encryption not available");
      return "";
    }
    try {
      const encrypted = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), "base64");
      return safeStorage.decryptString(encrypted);
    } catch (error) {
      console.error("[Config] Failed to decrypt value:", error);
      return "";
    }
  }

  /**
   * Decrypt sensitive fields in config
   */
  private decryptConfig(config: AppConfig): AppConfig {
    return {
      ...config,
      speech: {
        ...config.speech,
        subscriptionKey: this.decrypt(config.speech.subscriptionKey),
      },
      openai: {
        ...config.openai,
        apiKey: this.decrypt(config.openai.apiKey),
      },
    };
  }

  /**
   * Encrypt sensitive fields for saving
   */
  private encryptConfig(config: AppConfig): AppConfig {
    return {
      ...config,
      speech: {
        ...config.speech,
        subscriptionKey: this.encrypt(config.speech.subscriptionKey),
      },
      openai: {
        ...config.openai,
        apiKey: this.encrypt(config.openai.apiKey),
      },
    };
  }

  private load(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf-8");
        const parsed = JSON.parse(data) as Partial<AppConfig>;
        // Merge with defaults to ensure all fields exist
        const merged = this.mergeWithDefaults(parsed);
        // Decrypt sensitive fields
        return this.decryptConfig(merged);
      }
    } catch (error) {
      console.error("[Config] Failed to load config:", error);
    }
    return { ...DEFAULT_CONFIG };
  }

  private mergeWithDefaults(partial: Partial<AppConfig>): AppConfig {
    return {
      auth: { ...DEFAULT_CONFIG.auth, ...partial.auth },
      speech: { ...DEFAULT_CONFIG.speech, ...partial.speech },
      openai: { ...DEFAULT_CONFIG.openai, ...partial.openai },
      hotkey: { ...DEFAULT_CONFIG.hotkey, ...partial.hotkey },
      preferences: { ...DEFAULT_CONFIG.preferences, ...partial.preferences },
    };
  }

  private save(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Encrypt sensitive fields before saving
      const encryptedConfig = this.encryptConfig(this.config);
      fs.writeFileSync(this.configPath, JSON.stringify(encryptedConfig, null, 2));
    } catch (error) {
      console.error("[Config] Failed to save config:", error);
    }
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
    this.save();
  }

  getAll(): AppConfig {
    return { ...this.config };
  }

  setAll(config: Partial<AppConfig>): void {
    this.config = this.mergeWithDefaults(config);
    this.save();
  }

  isConfigured(): boolean {
    // Check that Azure OpenAI is configured for transcription
    return !!(
      this.config.openai.endpoint &&
      this.config.openai.apiKey &&
      this.config.openai.transcriptionDeploymentName
    );
  }

  /**
   * Check if encryption is available on this system
   */
  isEncryptionAvailable(): boolean {
    return this.encryptionAvailable;
  }
}
