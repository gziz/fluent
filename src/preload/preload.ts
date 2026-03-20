import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/types";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

// Speech recognition state (managed in preload since SDK can't cross contextBridge)
let recognizer: SpeechSDK.SpeechRecognizer | null = null;
let accumulatedText: string[] = [];
let preloadTimings: Record<string, number> = {};

// Setup speech recognition handlers
ipcRenderer.on(IPC_CHANNELS.SPEECH_START, (_event, config: { subscriptionKey: string; region: string; language: string }) => {
  const startTime = Date.now();
  console.log('[Preload] Starting recognition...');
  preloadTimings = {};

  try {
    accumulatedText = [];

    // Use subscription key authentication
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      config.subscriptionKey,
      config.region
    );
    speechConfig.speechRecognitionLanguage = config.language || 'en-US';
    const configCreatedMs = Date.now() - startTime;
    preloadTimings['sdk-config-create'] = configCreatedMs;
    console.log(`[Preload] SpeechConfig created (${configCreatedMs}ms)`);
    
    // Use default microphone input
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const audioConfigMs = Date.now() - startTime;
    preloadTimings['sdk-audio-config'] = audioConfigMs - configCreatedMs;
    console.log(`[Preload] AudioConfig created (${audioConfigMs}ms)`);
    
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    const recognizerCreateMs = Date.now() - startTime;
    preloadTimings['sdk-recognizer-create'] = recognizerCreateMs - audioConfigMs;
    console.log(`[Preload] Recognizer created (${recognizerCreateMs}ms)`);
    
    // Handle intermediate results
    recognizer.recognizing = (_sender, event) => {
      console.log('[Preload] Recognizing:', event.result.text);
      ipcRenderer.send(IPC_CHANNELS.SPEECH_PARTIAL, event.result.text);
    };
    
    // Handle final recognized segments
    recognizer.recognized = (_sender, event) => {
      if (event.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        if (event.result.text.trim()) {
          accumulatedText.push(event.result.text);
          console.log('[Preload] Recognized:', event.result.text);
        }
      }
    };
    
    // Handle errors
    recognizer.canceled = (_sender, event) => {
      if (event.reason === SpeechSDK.CancellationReason.Error) {
        console.error('[Preload] Error:', event.errorCode, event.errorDetails);
        ipcRenderer.send(IPC_CHANNELS.SPEECH_ERROR, `${event.errorCode}: ${event.errorDetails}`);
      }
    };
    
    // Start continuous recognition
    recognizer.startContinuousRecognitionAsync(
      () => {
        const totalStartMs = Date.now() - startTime;
        preloadTimings['sdk-start-recognition'] = totalStartMs - recognizerCreateMs;
        preloadTimings['sdk-total-init'] = totalStartMs;
        console.log(`[Preload] Recognition started (${totalStartMs}ms total init)`);
        ipcRenderer.send(IPC_CHANNELS.SPEECH_STARTED);
        // Send timing data back to main process
        ipcRenderer.send(IPC_CHANNELS.PERF_TIMINGS, preloadTimings);
      },
      (error) => {
        console.error('[Preload] Failed to start:', error);
        ipcRenderer.send(IPC_CHANNELS.SPEECH_ERROR, String(error));
      }
    );
  } catch (error) {
    console.error('[Preload] Setup error:', error);
    ipcRenderer.send(IPC_CHANNELS.SPEECH_ERROR, error instanceof Error ? error.message : String(error));
  }
});

// Handle sound playback requests from main process
ipcRenderer.on(IPC_CHANNELS.SOUND_PLAY, (_event, soundPath: string) => {
  try {
    // On macOS, paths start with '/', so we need file:// + path
    // On Windows, paths start with 'C:\', so we need file:/// + path
    const normalizedPath = soundPath.replace(/\\/g, '/');
    const fileUrl = normalizedPath.startsWith('/')
      ? `file://${normalizedPath}`
      : `file:///${normalizedPath}`;
    const audio = new Audio(fileUrl);
    audio.play().catch(err => console.error('[Preload] Failed to play sound:', err));
  } catch (error) {
    console.error('[Preload] Error creating audio:', error);
  }
});

ipcRenderer.on(IPC_CHANNELS.SPEECH_STOP, () => {
  const stopStartTime = Date.now();
  console.log('[Preload] Stopping recognition');
  
  if (!recognizer) {
    ipcRenderer.send(IPC_CHANNELS.SPEECH_RESULT, '');
    return;
  }
  
  recognizer.stopContinuousRecognitionAsync(
    () => {
      const stopDurationMs = Date.now() - stopStartTime;
      console.log(`[Preload] Recognition stopped (${stopDurationMs}ms)`);
      const fullText = accumulatedText.join(' ').trim();
      console.log('[Preload] Final transcript:', fullText);
      
      // Send updated preload timings with stop duration
      preloadTimings['sdk-stop-recognition'] = stopDurationMs;
      ipcRenderer.send(IPC_CHANNELS.PERF_TIMINGS, preloadTimings);
      
      recognizer?.close();
      recognizer = null;
      accumulatedText = [];
      
      ipcRenderer.send(IPC_CHANNELS.SPEECH_RESULT, fullText);
    },
    (error) => {
      const stopDurationMs = Date.now() - stopStartTime;
      console.error(`[Preload] Error stopping (${stopDurationMs}ms):`, error);
      const fullText = accumulatedText.join(' ').trim();
      
      preloadTimings['sdk-stop-recognition'] = stopDurationMs;
      preloadTimings['sdk-stop-error'] = 1;
      ipcRenderer.send(IPC_CHANNELS.PERF_TIMINGS, preloadTimings);
      
      if (recognizer) {
        recognizer.close();
        recognizer = null;
      }
      accumulatedText = [];
      
      ipcRenderer.send(IPC_CHANNELS.SPEECH_RESULT, fullText);
    }
  );
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
      ipcRenderer.on(IPC_CHANNELS.OVERLAY_STATE, (_event, state, partialText) => callback(state, partialText));
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
          speech: { subscriptionKey: string; region: string; language: string; resourceId?: string };
          openai: { endpoint: string; deploymentName: string; apiKey: string };
          hotkey: { accelerator: string };
          preferences: { playAudioFeedback: boolean; restoreClipboard: boolean; startAtLogin: boolean };
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
        onStateChange: (callback: (state: string, partialText?: string) => void) => void;
        hide: () => void;
      };
    };
  }
}
