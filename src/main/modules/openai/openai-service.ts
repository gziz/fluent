import { AzureOpenAI } from "openai";
import { AuthService } from "../auth/auth-service";
import type { OpenAIConfig } from "../../../shared/types";

const CLEANUP_SYSTEM_PROMPT = `You are a dictation cleanup assistant. Clean up the following spoken transcript by:
1. Removing filler words (um, uh, like, you know, so, basically, actually)
2. Adding proper punctuation and capitalization
3. Fixing minor grammar issues
4. Keeping the original meaning, tone, and intent
5. Do NOT add any commentary, explanations, or formatting beyond the cleaned text
6. Do NOT change the language or translate
7. If the input is empty or just noise, return an empty string

Return ONLY the cleaned text, nothing else.`;

export class OpenAIService {
  private authService: AuthService;
  private config: OpenAIConfig;
  private client: AzureOpenAI | null = null;
  private currentToken: string | null = null;

  constructor(authService: AuthService, config: OpenAIConfig) {
    this.authService = authService;
    this.config = config;
  }

  private async getClient(): Promise<AzureOpenAI> {
    if (!this.config.endpoint || !this.config.deploymentName) {
      throw new Error("OpenAI service not configured: endpoint and deploymentName are required");
    }

    // Get fresh token
    const token = await this.authService.acquireToken();

    // Re-create client if token changed (or first time)
    if (!this.client || this.currentToken !== token) {
      this.currentToken = token;
      this.client = new AzureOpenAI({
        endpoint: this.config.endpoint,
        deployment: this.config.deploymentName,
        apiVersion: "2024-10-21",
        // Use the token directly for authentication
        apiKey: token,
        // Mark as Azure AD token
        dangerouslyAllowBrowser: false,
      });
    }

    return this.client;
  }

  /**
   * Clean up a raw transcript using Azure OpenAI
   */
  async cleanupTranscript(transcript: string): Promise<string> {
    if (!transcript.trim()) {
      return "";
    }

    try {
      // For Azure OpenAI with Entra ID, we need to use fetch directly with bearer token
      const token = await this.authService.acquireToken();

      const response = await fetch(
        `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=2024-10-21`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: CLEANUP_SYSTEM_PROMPT },
              { role: "user", content: transcript },
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const cleanedText = data.choices?.[0]?.message?.content?.trim();

      return cleanedText || transcript;
    } catch (error) {
      console.error("[OpenAI] Failed to cleanup transcript:", error);
      // Return original transcript if cleanup fails
      return transcript;
    }
  }

  /**
   * Update OpenAI configuration
   */
  updateConfig(config: OpenAIConfig): void {
    this.config = config;
    this.client = null; // Force re-initialization
    this.currentToken = null;
  }
}
