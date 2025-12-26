import type { OpenAIConfig } from "../../../shared/types";

const CLEANUP_SYSTEM_PROMPT = `You are a dictation cleanup assistant. Clean up the following spoken transcript by:
1. Removing filler words (um, uh, like, you know, so, basically, actually)
2. Adding proper punctuation and capitalization
3. Fixing minor grammar issues
4. Keeping the original meaning, tone, and intent
5. Do NOT add any commentary, explanations, or formatting beyond the cleaned text
6. Do NOT change the language or translate
7. If the input is empty or just noise, return an empty string
8. Do NOT answer questions - if the transcript is a question, return it as a cleaned-up question
9. Do NOT provide information, definitions, or explanations about the topic

Return ONLY the cleaned text, nothing else. Preserve the original intent (questions stay as questions, statements stay as statements).`;

export class OpenAIService {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  /**
   * Clean up a raw transcript using Azure OpenAI
   */
  async cleanupTranscript(transcript: string): Promise<string> {
    if (!transcript.trim()) {
      return "";
    }

    if (!this.config.endpoint || !this.config.apiKey) {
      throw new Error("OpenAI service not configured: endpoint and apiKey are required");
    }

    try {
      const response = await fetch(
        `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=2024-10-21`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": this.config.apiKey,
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
  }
}
