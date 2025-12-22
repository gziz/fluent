import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import type { AppConfig } from "../../../shared/types";

const DEFAULT_CONFIG: AppConfig = {
  auth: {
    clientId: "",
    tenantId: "",
  },
  speech: {
    resourceId: "",
    region: "eastus",
    language: "en-US",
  },
  openai: {
    endpoint: "",
    deploymentName: "gpt-4o-mini",
  },
  hotkey: {
    accelerator: "Ctrl+Shift+Space",
  },
  preferences: {
    playAudioFeedback: true,
    restoreClipboard: true,
  },
};

export class ConfigStore {
  private configPath: string;
  private config: AppConfig;

  constructor() {
    this.configPath = path.join(app.getPath("userData"), "config.json");
    this.config = this.load();
  }

  private load(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf-8");
        const parsed = JSON.parse(data) as Partial<AppConfig>;
        // Merge with defaults to ensure all fields exist
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.error("Failed to load config:", error);
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
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error("Failed to save config:", error);
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
    // For Azure CLI auth, we don't need clientId/tenantId
    // Just check that the service endpoints are configured
    return !!(
      this.config.speech.resourceId &&
      this.config.openai.endpoint
    );
  }
}
