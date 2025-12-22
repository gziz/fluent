import { AzureCliCredential } from "@azure/identity";
import type { AuthConfig, AuthStatus } from "../../../shared/types";

// Scopes for Azure Cognitive Services (covers both Speech and OpenAI)
const COGNITIVE_SERVICES_SCOPE = "https://cognitiveservices.azure.com/.default";

/**
 * Authentication service using Azure CLI credentials.
 * Requires user to run `az login` before using the app.
 *
 * NOTE: For production, this can be extended to use MSAL with App Registration
 * for a proper browser-based sign-in flow. See the original implementation
 * in git history or AZURE_SETUP.md for details.
 */
export class AuthService {
  private credential: AzureCliCredential | null = null;
  private cachedAccountInfo: { name: string; email: string } | null = null;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Get or create the Azure CLI credential
   */
  private getCredential(): AzureCliCredential {
    if (!this.credential) {
      this.credential = new AzureCliCredential();
    }
    return this.credential;
  }

  /**
   * Acquire token using Azure CLI credentials
   */
  async acquireToken(): Promise<string> {
    console.log("[Auth] Acquiring token via Azure CLI...");

    try {
      const credential = this.getCredential();
      const token = await credential.getToken(COGNITIVE_SERVICES_SCOPE);

      if (!token) {
        throw new Error("Failed to acquire token from Azure CLI");
      }

      console.log("[Auth] Token acquired successfully");
      return token.token;
    } catch (error) {
      console.error("[Auth] Failed to acquire token:", error);
      throw new Error(
        "Failed to get Azure CLI token. Make sure you've run 'az login' first.\n\n" +
        `Details: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * "Sign in" - for Azure CLI, this just verifies the credentials work
   */
  async signIn(): Promise<void> {
    console.log("[Auth] Verifying Azure CLI credentials...");

    try {
      // Try to get a token to verify credentials are valid
      await this.acquireToken();

      // Try to get account info from az cli
      await this.refreshAccountInfo();

      console.log("[Auth] Azure CLI credentials verified");
    } catch (error) {
      throw new Error(
        "Could not verify Azure CLI credentials.\n\n" +
        "Please run 'az login' in your terminal first, then try again."
      );
    }
  }

  /**
   * Refresh account info from Azure CLI
   */
  private async refreshAccountInfo(): Promise<void> {
    try {
      // Use child_process to get account info from az cli
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const { stdout } = await execAsync("az account show --query \"{name:user.name, email:user.name}\" -o json");
      const info = JSON.parse(stdout);
      this.cachedAccountInfo = {
        name: info.name || "Azure CLI User",
        email: info.email || ""
      };
    } catch {
      // If we can't get account info, just use defaults
      this.cachedAccountInfo = {
        name: "Azure CLI User",
        email: ""
      };
    }
  }

  /**
   * "Sign out" - for Azure CLI, this just clears the cached credential
   * User would need to run `az logout` to fully sign out
   */
  async signOut(): Promise<void> {
    console.log("[Auth] Clearing cached credentials");
    this.credential = null;
    this.cachedAccountInfo = null;
  }

  /**
   * Check if Azure CLI credentials are available
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const credential = this.getCredential();
      // Try to get a token - if it works, we're authenticated
      const token = await credential.getToken(COGNITIVE_SERVICES_SCOPE);

      if (token && !this.cachedAccountInfo) {
        await this.refreshAccountInfo();
      }

      return !!token;
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
      accountName: this.cachedAccountInfo?.name || "Azure CLI User",
      accountEmail: this.cachedAccountInfo?.email,
    };
  }

  /**
   * Update auth configuration (not used for Azure CLI auth, but kept for interface compatibility)
   */
  updateConfig(config: AuthConfig): void {
    this.config = config;
    // Reset credential to pick up any config changes
    this.credential = null;
  }
}
