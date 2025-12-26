import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/types";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

// Speech recognition state (managed in preload since SDK can't cross contextBridge)
let recognizer: SpeechSDK.SpeechRecognizer | null = null;
let accumulatedText: string[] = [];

// Setup speech recognition handlers
ipcRenderer.on(IPC_CHANNELS.SPEECH_START, (_event, config: { subscriptionKey: string; region: string; language: string }) => {
  const startTime = Date.now();
  console.log('[Preload] Starting recognition...');

  try {
    accumulatedText = [];

    // Use subscription key authentication
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      config.subscriptionKey,
      config.region
    );
    speechConfig.speechRecognitionLanguage = config.language || 'en-US';
    console.log(`[Preload] SpeechConfig created (${Date.now() - startTime}ms)`);
    
    // Use default microphone input
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    console.log(`[Preload] AudioConfig created (${Date.now() - startTime}ms)`);
    
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    console.log(`[Preload] Recognizer created (${Date.now() - startTime}ms)`);
    
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
        console.log('[Preload] Recognition started');
        ipcRenderer.send(IPC_CHANNELS.SPEECH_STARTED);
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
    const audio = new Audio(`file:///${soundPath.replace(/\\/g, '/')}`);
    audio.play().catch(err => console.error('[Preload] Failed to play sound:', err));
  } catch (error) {
    console.error('[Preload] Error creating audio:', error);
  }
});

ipcRenderer.on(IPC_CHANNELS.SPEECH_STOP, () => {
  console.log('[Preload] Stopping recognition');
  
  if (!recognizer) {
    ipcRenderer.send(IPC_CHANNELS.SPEECH_RESULT, '');
    return;
  }
  
  recognizer.stopContinuousRecognitionAsync(
    () => {
      console.log('[Preload] Recognition stopped');
      const fullText = accumulatedText.join(' ').trim();
      console.log('[Preload] Final transcript:', fullText);
      
      recognizer?.close();
      recognizer = null;
      accumulatedText = [];
      
      ipcRenderer.send(IPC_CHANNELS.SPEECH_RESULT, fullText);
    },
    (error) => {
      console.error('[Preload] Error stopping:', error);
      const fullText = accumulatedText.join(' ').trim();
      
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
