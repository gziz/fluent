import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/types";

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
});

// Type declaration for the exposed API
declare global {
  interface Window {
    api: {
      config: {
        getAll: () => Promise<{
          auth: { clientId: string; tenantId: string };
          speech: { resourceId: string; region: string; language: string };
          openai: { endpoint: string; deploymentName: string };
          hotkey: { accelerator: string };
          preferences: { playAudioFeedback: boolean; restoreClipboard: boolean };
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
    };
  }
}
