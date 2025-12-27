import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/types";
import WebSocket from "ws";

// Configuration passed from main process
interface TranscriptionConfig {
  endpoint: string;
  apiKey: string;
  transcriptionDeploymentName: string;
  language: string;
}

// WebSocket and audio state
let ws: WebSocket | null = null;
let audioContext: AudioContext | null = null;
let audioWorklet: AudioWorkletNode | null = null;
let mediaStream: MediaStream | null = null;
let accumulatedText: string[] = [];
let currentPartialText = "";
let currentConfig: TranscriptionConfig | null = null;

// Reconnection state
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 1000;
let reconnectAttempts = 0;
let isIntentionallyStopping = false;

/**
 * Build WebSocket URL from Azure OpenAI endpoint
 * For transcription intent, the model is specified via the deployment parameter
 */
function buildWebSocketUrl(endpoint: string, deploymentName: string): string {
  // Convert https:// to wss://
  const wsEndpoint = endpoint.replace("https://", "wss://").replace(/\/$/, "");
  // Format: /openai/realtime?api-version=xxx&deployment=xxx&intent=transcription
  return `${wsEndpoint}/openai/realtime?api-version=2025-04-01-preview&deployment=${deploymentName}&intent=transcription`;
}

/**
 * Resample audio from 48kHz to 24kHz using decimation with averaging
 */
function resample48to24(samples: Float32Array): Float32Array {
  const outputLength = Math.floor(samples.length / 2);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const idx = i * 2;
    // Average adjacent samples for basic low-pass filtering
    output[i] = (samples[idx] + samples[idx + 1]) / 2;
  }

  return output;
}

/**
 * Convert Float32 audio samples to Int16 (PCM16)
 */
function float32ToPcm16(samples: Float32Array): Int16Array {
  const output = new Int16Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    // Clamp to [-1, 1] range
    const s = Math.max(-1, Math.min(1, samples[i]));
    // Convert to 16-bit integer
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return output;
}

/**
 * Convert Int16Array to base64 string
 */
function pcm16ToBase64(pcm16: Int16Array): string {
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Handle incoming WebSocket messages
 */
function handleWebSocketMessage(data: WebSocket.Data): void {
  try {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case "transcription_session.created":
      case "transcription_session.updated":
        // Session events - no action needed
        break;

      case "conversation.item.input_audio_transcription.completed":
        // Main transcription event - accumulate completed segments
        if (message.transcript?.trim()) {
          accumulatedText.push(message.transcript);
          ipcRenderer.send(IPC_CHANNELS.SPEECH_PARTIAL, accumulatedText.join(" "));
        }
        currentPartialText = "";
        break;

      case "conversation.item.input_audio_transcription.delta":
        // Streaming partial transcription
        currentPartialText += message.delta || "";
        ipcRenderer.send(IPC_CHANNELS.SPEECH_PARTIAL, currentPartialText);
        break;

      case "input_audio_buffer.speech_started":
      case "input_audio_buffer.speech_stopped":
      case "input_audio_buffer.committed":
      case "conversation.item.created":
        // Audio flow events - no action needed
        break;

      case "error":
        // Ignore empty buffer commit errors (server VAD already committed)
        if (message.error?.code !== "input_audio_buffer_commit_empty") {
          console.error("[Preload] WebSocket error:", message.error);
          ipcRenderer.send(
            IPC_CHANNELS.SPEECH_ERROR,
            message.error?.message || "Unknown WebSocket error"
          );
        }
        break;

      default:
        // Ignore other message types
        break;
    }
  } catch (error) {
    console.error("[Preload] Failed to parse WebSocket message:", error);
  }
}

/**
 * Connect to Azure OpenAI Realtime WebSocket
 */
async function connectWebSocket(config: TranscriptionConfig): Promise<void> {
  const url = buildWebSocketUrl(config.endpoint, config.transcriptionDeploymentName);
  console.log("[Preload] Connecting to WebSocket:", url);

  return new Promise((resolve, reject) => {
    ws = new WebSocket(url, {
      headers: {
        "api-key": config.apiKey,
      },
    });

    ws.on("open", () => {
      // Send transcription session configuration
      const sessionConfig = {
        type: "transcription_session.update",
        session: {
          input_audio_format: "pcm16",
          input_audio_transcription: {
            model: "whisper-1",
            language: config.language?.substring(0, 2) || "en",
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      };

      ws!.send(JSON.stringify(sessionConfig));
      reconnectAttempts = 0;
      ipcRenderer.send(IPC_CHANNELS.SPEECH_STARTED);
      resolve();
    });

    ws.on("message", handleWebSocketMessage);

    ws.on("error", (error) => {
      console.error("[Preload] WebSocket error:", error);
      reject(error);
    });

    ws.on("close", () => {
      // Attempt reconnection if not intentionally stopping
      if (!isIntentionallyStopping && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && currentConfig) {
        reconnectAttempts++;
        setTimeout(async () => {
          try {
            await connectWebSocket(currentConfig!);
          } catch (err) {
            console.error("[Preload] Reconnect failed:", err);
          }
        }, RECONNECT_DELAY_MS);
      }
    });
  });
}

/**
 * Start audio capture using Web Audio API
 */
async function startAudioCapture(): Promise<void> {
  // Get microphone access
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: 48000,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  // Create AudioContext at 48kHz (standard browser rate)
  audioContext = new AudioContext({ sampleRate: 48000 });

  // Load AudioWorklet processor
  const baseUrl = document.location.href.substring(0, document.location.href.lastIndexOf('/'));
  await audioContext.audioWorklet.addModule(`${baseUrl}/audio-processor.js`);

  // Create source and processor nodes
  const source = audioContext.createMediaStreamSource(mediaStream);
  audioWorklet = new AudioWorkletNode(audioContext, "audio-processor");

  // Handle audio data from worklet - send to WebSocket
  audioWorklet.port.onmessage = (event) => {
    if (event.data.type === "audio" && ws?.readyState === WebSocket.OPEN) {
      const resampled = resample48to24(event.data.samples);
      const pcm16 = float32ToPcm16(resampled);
      const base64Audio = pcm16ToBase64(pcm16);

      ws.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64Audio,
        })
      );
    }
  };

  // Connect source to worklet (not to destination - we don't want to hear ourselves)
  source.connect(audioWorklet);
}

/**
 * Cleanup all resources
 */
function cleanup(): void {
  if (audioWorklet) {
    audioWorklet.disconnect();
    audioWorklet.port.close();
    audioWorklet = null;
  }

  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  currentConfig = null;
}

// Handle SPEECH_START from main process
ipcRenderer.on(
  IPC_CHANNELS.SPEECH_START,
  async (_event, config: TranscriptionConfig) => {
    try {
      // Reset state
      accumulatedText = [];
      currentPartialText = "";
      isIntentionallyStopping = false;
      currentConfig = config;

      // Connect to WebSocket and start audio capture
      await connectWebSocket(config);
      await startAudioCapture();
    } catch (error) {
      console.error("[Preload] Failed to start transcription:", error);
      ipcRenderer.send(
        IPC_CHANNELS.SPEECH_ERROR,
        error instanceof Error ? error.message : String(error)
      );
      cleanup();
    }
  }
);

// Handle SPEECH_STOP from main process
ipcRenderer.on(IPC_CHANNELS.SPEECH_STOP, () => {
  isIntentionallyStopping = true;

  // Server VAD auto-commits, so we don't need to manually commit
  // Wait for any pending transcriptions to complete
  setTimeout(() => {
    const fullText = accumulatedText.join(" ").trim();
    cleanup();
    ipcRenderer.send(IPC_CHANNELS.SPEECH_RESULT, fullText);
  }, 1000);
});

// Handle sound playback requests from main process
ipcRenderer.on(IPC_CHANNELS.SOUND_PLAY, (_event, soundPath: string) => {
  try {
    // Normalize path for file:// URL
    // macOS: /path/to/file -> file:///path/to/file
    // Windows: C:\path\to\file -> file:///C:/path/to/file
    let fileUrl: string;
    if (soundPath.startsWith("/")) {
      // Unix-style path (macOS/Linux)
      fileUrl = `file://${soundPath}`;
    } else {
      // Windows path
      fileUrl = `file:///${soundPath.replace(/\\/g, "/")}`;
    }
    const audio = new Audio(fileUrl);
    audio.play().catch((err) => console.error("[Preload] Failed to play sound:", err));
  } catch (error) {
    console.error("[Preload] Error creating audio:", error);
  }
});

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld("api", {
  config: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET_ALL),
    set: (key: string, value: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, key, value),
  },
  auth: {
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_STATUS),
    signIn: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_SIGN_IN),
    signOut: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_SIGN_OUT),
  },
  speech: {
    // Just send ready signal - actual speech handling is done above
    sendReady: () => ipcRenderer.send(IPC_CHANNELS.SPEECH_READY),
  },
  overlay: {
    onStateChange: (callback: (state: string, partialText?: string) => void) => {
      ipcRenderer.on(IPC_CHANNELS.OVERLAY_STATE, (_event, state, partialText) =>
        callback(state, partialText)
      );
    },
    hide: () => ipcRenderer.send(IPC_CHANNELS.OVERLAY_HIDE),
  },
});

// Type declaration for the exposed API
declare global {
  interface Window {
    api: {
      config: {
        getAll: () => Promise<{
          auth: { clientId: string; tenantId: string };
          speech: {
            subscriptionKey: string;
            region: string;
            language: string;
            resourceId?: string;
          };
          openai: {
            endpoint: string;
            deploymentName: string;
            transcriptionDeploymentName: string;
            apiKey: string;
          };
          hotkey: { accelerator: string };
          preferences: {
            playAudioFeedback: boolean;
            restoreClipboard: boolean;
            startAtLogin: boolean;
          };
        }>;
        set: (key: string, value: unknown) => Promise<boolean>;
      };
      auth: {
        getStatus: () => Promise<{
          isAuthenticated: boolean;
          accountName?: string;
          accountEmail?: string;
        }>;
        signIn: () => Promise<{
          isAuthenticated: boolean;
          accountName?: string;
          accountEmail?: string;
        }>;
        signOut: () => Promise<{
          isAuthenticated: boolean;
          accountName?: string;
          accountEmail?: string;
        }>;
      };
      speech: {
        sendReady: () => void;
      };
      overlay: {
        onStateChange: (
          callback: (state: string, partialText?: string) => void
        ) => void;
        hide: () => void;
      };
    };
  }
}
