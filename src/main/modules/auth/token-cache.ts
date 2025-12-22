import * as fs from "fs";
import * as path from "path";
import { app, safeStorage } from "electron";
import type { ICachePlugin, TokenCacheContext } from "@azure/msal-node";

/**
 * MSAL Token Cache Plugin that uses Electron's safeStorage API
 * to encrypt tokens at rest using OS-level encryption (DPAPI on Windows).
 */
export class TokenCache implements ICachePlugin {
  private cachePath: string;

  constructor() {
    this.cachePath = path.join(app.getPath("userData"), "token-cache.enc");
  }

  async beforeCacheAccess(context: TokenCacheContext): Promise<void> {
    try {
      if (fs.existsSync(this.cachePath) && safeStorage.isEncryptionAvailable()) {
        const encrypted = fs.readFileSync(this.cachePath);
        const decrypted = safeStorage.decryptString(encrypted);
        context.tokenCache.deserialize(decrypted);
      }
    } catch (error) {
      console.error("Failed to read token cache:", error);
      // If cache is corrupted, we'll just start fresh
    }
  }

  async afterCacheAccess(context: TokenCacheContext): Promise<void> {
    if (context.cacheHasChanged) {
      try {
        const dir = path.dirname(this.cachePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const serialized = context.tokenCache.serialize();

        if (safeStorage.isEncryptionAvailable()) {
          const encrypted = safeStorage.encryptString(serialized);
          fs.writeFileSync(this.cachePath, encrypted);
        } else {
          // Fallback: write unencrypted (not recommended for production)
          console.warn("safeStorage not available, storing tokens unencrypted");
          fs.writeFileSync(this.cachePath, serialized);
        }
      } catch (error) {
        console.error("Failed to write token cache:", error);
      }
    }
  }

  /**
   * Clear the token cache (for sign-out)
   */
  clear(): void {
    try {
      if (fs.existsSync(this.cachePath)) {
        fs.unlinkSync(this.cachePath);
      }
    } catch (error) {
      console.error("Failed to clear token cache:", error);
    }
  }
}
