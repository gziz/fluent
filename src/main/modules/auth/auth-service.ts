import {
  PublicClientApplication,
  Configuration,
  AuthenticationResult,
  AccountInfo,
  InteractionRequiredAuthError,
  LogLevel,
} from "@azure/msal-node";
import { shell } from "electron";
import { TokenCache } from "./token-cache";
import type { AuthConfig, AuthStatus } from "../../../shared/types";

// Scopes for Azure Cognitive Services (covers both Speech and OpenAI)
const COGNITIVE_SERVICES_SCOPE = "https://cognitiveservices.azure.com/.default";

export class AuthService {
  private msalClient: PublicClientApplication | null = null;
  private tokenCache: TokenCache;
  private account: AccountInfo | null = null;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
    this.tokenCache = new TokenCache();
  }

  private async getClient(): Promise<PublicClientApplication> {
    if (!this.msalClient) {
      if (!this.config.clientId || !this.config.tenantId) {
        throw new Error("Auth not configured: clientId and tenantId are required");
      }

      const msalConfig: Configuration = {
        auth: {
          clientId: this.config.clientId,
          authority: `https://login.microsoftonline.com/${this.config.tenantId}`,
        },
        cache: {
          cachePlugin: this.tokenCache,
        },
        system: {
          loggerOptions: {
            loggerCallback: (level, message) => {
              if (level === LogLevel.Error) {
                console.error("[MSAL]", message);
              }
            },
            logLevel: LogLevel.Error,
          },
        },
      };

      this.msalClient = new PublicClientApplication(msalConfig);

      // Try to restore account from cache
      const accounts = await this.msalClient.getTokenCache().getAllAccounts();
      if (accounts.length > 0) {
        this.account = accounts[0];
      }
    }
    return this.msalClient;
  }

  /**
   * Acquire token silently using cached credentials, or interactively if needed.
   */
  async acquireToken(): Promise<string> {
    const client = await this.getClient();

    // Try silent acquisition first
    if (this.account) {
      try {
        const result = await client.acquireTokenSilent({
          account: this.account,
          scopes: [COGNITIVE_SERVICES_SCOPE],
        });
        return result.accessToken;
      } catch (error) {
        if (!(error instanceof InteractionRequiredAuthError)) {
          console.error("Silent token acquisition failed:", error);
        }
        // Fall through to interactive
      }
    }

    // Interactive acquisition required
    return this.acquireTokenInteractive();
  }

  /**
   * Acquire token interactively using device code flow.
   * Opens browser for user to authenticate.
   */
  private async acquireTokenInteractive(): Promise<string> {
    const client = await this.getClient();

    const result = await client.acquireTokenByDeviceCode({
      scopes: [COGNITIVE_SERVICES_SCOPE],
      deviceCodeCallback: (response) => {
        console.log(response.message);
        // Open the verification URL in the default browser
        shell.openExternal(response.verificationUri);
      },
    });

    if (!result) {
      throw new Error("Authentication failed: no result received");
    }

    this.account = result.account;
    return result.accessToken;
  }

  /**
   * Sign in interactively
   */
  async signIn(): Promise<AuthenticationResult> {
    const client = await this.getClient();

    const result = await client.acquireTokenByDeviceCode({
      scopes: [COGNITIVE_SERVICES_SCOPE],
      deviceCodeCallback: (response) => {
        console.log(response.message);
        shell.openExternal(response.verificationUri);
      },
    });

    if (!result) {
      throw new Error("Authentication failed: no result received");
    }

    this.account = result.account;
    return result;
  }

  /**
   * Sign out and clear cached tokens
   */
  async signOut(): Promise<void> {
    if (this.msalClient && this.account) {
      const cache = this.msalClient.getTokenCache();
      await cache.removeAccount(this.account);
    }
    this.tokenCache.clear();
    this.account = null;
    this.msalClient = null;
  }

  /**
   * Check if user is authenticated (has cached account)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getClient();
      return this.account !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get current authentication status
   */
  async getStatus(): Promise<AuthStatus> {
    const isAuthenticated = await this.isAuthenticated();
    return {
      isAuthenticated,
      accountName: this.account?.name,
      accountEmail: this.account?.username,
    };
  }

  /**
   * Update auth configuration
   */
  updateConfig(config: AuthConfig): void {
    this.config = config;
    this.msalClient = null; // Force re-initialization
  }
}
