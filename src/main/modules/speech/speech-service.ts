import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { AuthService } from "../auth/auth-service";
import type { SpeechConfig as AppSpeechConfig } from "../../../shared/types";

export class SpeechService {
  private authService: AuthService;
  private config: AppSpeechConfig;
  private recognizer: sdk.SpeechRecognizer | null = null;
  private accumulatedText: string[] = [];
  private isRecognizing = false;

  constructor(authService: AuthService, config: AppSpeechConfig) {
    this.authService = authService;
    this.config = config;
  }

  /**
   * Start continuous speech recognition
   */
  async startRecognition(): Promise<void> {
    if (this.isRecognizing) {
      console.warn("Recognition already in progress");
      return;
    }

    if (!this.config.resourceId || !this.config.region) {
      throw new Error("Speech service not configured: resourceId and region are required");
    }

    this.accumulatedText = [];
    this.isRecognizing = true;

    // Get Entra ID token
    const token = await this.authService.acquireToken();

    // Build authorization token format for Speech SDK with Entra ID
    // Format: aad#{resourceId}#{accessToken}
    const authToken = `aad#${this.config.resourceId}#${token}`;

    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
      authToken,
      this.config.region
    );
    speechConfig.speechRecognitionLanguage = this.config.language || "en-US";

    // Use default microphone input
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();

    this.recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // Handle intermediate results (partial transcription while speaking)
    this.recognizer.recognizing = (_sender, event) => {
      // Could emit partial results for UI feedback if needed
      console.log(`[Speech] Recognizing: ${event.result.text}`);
    };

    // Handle final recognized segments
    this.recognizer.recognized = (_sender, event) => {
      if (event.result.reason === sdk.ResultReason.RecognizedSpeech) {
        if (event.result.text.trim()) {
          this.accumulatedText.push(event.result.text);
          console.log(`[Speech] Recognized: ${event.result.text}`);
        }
      } else if (event.result.reason === sdk.ResultReason.NoMatch) {
        console.log("[Speech] No match - could not recognize speech");
      }
    };

    // Handle errors
    this.recognizer.canceled = (_sender, event) => {
      if (event.reason === sdk.CancellationReason.Error) {
        console.error(`[Speech] Error: ${event.errorCode} - ${event.errorDetails}`);
      }
      this.isRecognizing = false;
    };

    // Handle session events
    this.recognizer.sessionStarted = () => {
      console.log("[Speech] Session started");
    };

    this.recognizer.sessionStopped = () => {
      console.log("[Speech] Session stopped");
      this.isRecognizing = false;
    };

    // Start continuous recognition
    await new Promise<void>((resolve, reject) => {
      this.recognizer!.startContinuousRecognitionAsync(
        () => {
          console.log("[Speech] Continuous recognition started");
          resolve();
        },
        (error) => {
          console.error("[Speech] Failed to start recognition:", error);
          this.isRecognizing = false;
          reject(new Error(error));
        }
      );
    });
  }

  /**
   * Stop continuous recognition and return accumulated transcript
   */
  async stopRecognition(): Promise<string> {
    if (!this.recognizer) {
      return "";
    }

    return new Promise<string>((resolve) => {
      this.recognizer!.stopContinuousRecognitionAsync(
        () => {
          console.log("[Speech] Recognition stopped");
          const fullText = this.accumulatedText.join(" ").trim();
          this.cleanup();
          resolve(fullText);
        },
        (error) => {
          console.error("[Speech] Error stopping recognition:", error);
          const fullText = this.accumulatedText.join(" ").trim();
          this.cleanup();
          resolve(fullText);
        }
      );
    });
  }

  /**
   * Check if currently recognizing
   */
  isActive(): boolean {
    return this.isRecognizing;
  }

  /**
   * Update speech configuration
   */
  updateConfig(config: AppSpeechConfig): void {
    this.config = config;
  }

  private cleanup(): void {
    if (this.recognizer) {
      this.recognizer.close();
      this.recognizer = null;
    }
    this.isRecognizing = false;
  }
}
