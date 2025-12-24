import type { AuthConfig, AuthStatus } from "../../../shared/types";

/**
 * Authentication service for API key-based authentication.
 *
 * NOTE: This is a simplified version for API key auth. The service interface
 * is kept intact for future browser-based sign-in (MSAL) support. With API keys,
 * authentication happens implicitly when making API calls - there's no separate
 * "sign in" step. The "authenticated" state simply means API keys are configured.
 */
export class AuthService {
  private config: AuthConfig;
  private apiKeysConfigured: boolean = false;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Set whether API keys are configured (called by app.ts when config is loaded)
   */
  setApiKeysConfigured(configured: boolean): void {
    this.apiKeysConfigured = configured;
  }

  /**
   * "Sign in" - for API key auth, this just marks as authenticated
   * In the future, this could trigger MSAL browser auth flow
   */
  async signIn(): Promise<void> {
    console.log("[Auth] API key mode - no sign-in required");
    // With API keys, "signing in" is a no-op
    // Authentication happens implicitly when API calls are made
  }

  /**
   * "Sign out" - for API key auth, this clears the authenticated state
   * In the future, this could clear MSAL tokens
   */
  async signOut(): Promise<void> {
    console.log("[Auth] Clearing authenticated state");
    this.apiKeysConfigured = false;
  }

  /**
   * Check if authenticated (i.e., API keys are configured)
   */
  async isAuthenticated(): Promise<boolean> {
    return this.apiKeysConfigured;
  }

  /**
   * Get current authentication status
   */
  async getStatus(): Promise<AuthStatus> {
    return {
      isAuthenticated: this.apiKeysConfigured,
      accountName: this.apiKeysConfigured ? "API Key" : undefined,
      accountEmail: undefined,
    };
  }

  /**
   * Update auth configuration (kept for interface compatibility)
   */
  updateConfig(config: AuthConfig): void {
    this.config = config;
  }
}
