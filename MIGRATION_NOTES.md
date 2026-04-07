# Migration: Azure CLI to API Key Authentication

## Summary

Migrated the app from requiring `az login` (Azure CLI credentials) to using API keys directly. This makes the app distributable without requiring users to have Azure CLI installed.

## Changes Made

### Files Modified

| File | Change |
|------|--------|
| `src/shared/types.ts` | Added `subscriptionKey` to SpeechConfig, `apiKey` to OpenAIConfig |
| `src/main/modules/config/config-store.ts` | Updated defaults and `isConfigured()` to check for API keys |
| `src/main/modules/auth/auth-service.ts` | Simplified for API key mode (removed `@azure/identity` usage) |
| `src/preload/preload.ts` | Uses `SpeechConfig.fromSubscription()` instead of token auth |
| `src/main/modules/openai/openai-service.ts` | Uses `api-key` header instead of Bearer token |
| `src/main/modules/speech/speech-service.ts` | Updated for API key auth (unused but kept for reference) |
| `src/renderer/settings.html` | Replaced az login UI with API key input fields |
| `src/main/app.ts` | Removed token acquisition, passes subscription key directly |
| `electron-builder.yml` | Changed target to `dir`, added `sign: null` to disable signing |

### Before vs After

| Aspect | Before (Azure CLI) | After (API Keys) |
|--------|-------------------|------------------|
| Setup | User runs `az login` in terminal | User enters API keys in Settings |
| Dependencies | Requires Azure CLI installed | No external dependencies |
| Auth method | Entra ID tokens via AzureCliCredential | Subscription keys from Azure Portal |

## User Configuration

Users now configure the app via Settings (tray menu):

1. **Speech Service API Key** - From Azure Portal → Speech resource → Keys and Endpoint
2. **Speech Region** - e.g., `eastus`, `westus2`
3. **OpenAI API Key** - From Azure Portal → OpenAI resource → Keys and Endpoint
4. **OpenAI Endpoint** - e.g., `https://your-resource.openai.azure.com`
5. **Deployment Name** - e.g., `gpt-4.1-nano`

## Next Steps: Packaging

### Current State

- The unpacked app builds successfully at `release/win-unpacked/`
- Can run directly via `release/win-unpacked/Fluent.exe`
- NSIS installer build fails due to Windows symlink permissions

### Issue

Electron-builder downloads `winCodeSign` tools which contain macOS symlinks. Windows requires admin privileges or Developer Mode to create symlinks, causing extraction to fail.

### Solutions

**Option 1: Enable Developer Mode (Recommended)**
1. Open Windows Settings
2. Go to Privacy & Security → For developers
3. Enable "Developer Mode"
4. Re-run `npm run dist:win`

**Option 2: Run as Administrator**
1. Open terminal as Administrator
2. Run `npm run dist:win`

**Option 3: Distribute Unpacked Build**
- Zip the `release/win-unpacked` folder
- Users extract and run `Fluent.exe` directly

### To Restore NSIS Installer

Once symlink issue is resolved, update `electron-builder.yml`:

```yaml
win:
  target:
    - target: nsis
      arch:
        - x64
```

## Future: Browser-Based Login

The `AuthService` interface is preserved for future MSAL browser-based login. The `AuthConfig` still has `clientId`/`tenantId` fields ready for when that feature is added.
