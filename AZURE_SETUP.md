# Azure Configuration for Fluent

## Quick Start

1. Run `az login` in your terminal
2. Open the app and go to Settings
3. Enter the values from the tables below
4. Click Save and start dictating!

---

## Your Azure Resources (Found via CLI)

### Speech Service
| Field | Value |
|-------|-------|
| **Resource Name** | gemoreno-speech-service |
| **Resource Group** | FHL_2025 |
| **Location/Region** | `eastus` |
| **Resource ID** | `/subscriptions/5faaddf8-b1c4-4064-8109-a11d29a34804/resourceGroups/FHL_2025/providers/Microsoft.CognitiveServices/accounts/gemoreno-speech-service` |

### Azure OpenAI / AI Services (Foundry)
| Field | Value |
|-------|-------|
| **Resource Name** | mich-test-agent-resource |
| **Resource Group** | MICHRedmondAzureRG |
| **Location** | eastus2 |
| **Endpoint** | `https://mich-test-agent-resource.cognitiveservices.azure.com/` |

### Available Model Deployments
| Deployment Name | Model |
|-----------------|-------|
| gpt-4.1-mini | gpt-4.1-mini |
| gpt-4.1 | gpt-4.1 |
| gpt-5-mini | gpt-5-mini |
| gpt-5 | gpt-5 |

**Recommended for Fluent:** `gpt-4.1-mini` (fast and cost-effective for text cleanup)

---

## Settings to Enter in Fluent App

Copy these values into the Settings window:

| Setting | Value |
|---------|-------|
| **Speech Resource ID** | `/subscriptions/5faaddf8-b1c4-4064-8109-a11d29a34804/resourceGroups/FHL_2025/providers/Microsoft.CognitiveServices/accounts/gemoreno-speech-service` |
| **Speech Region** | `eastus` |
| **OpenAI Endpoint** | `https://mich-test-agent-resource.cognitiveservices.azure.com/` |
| **OpenAI Deployment Name** | `gpt-4.1-mini` |

---

## Authentication

The app uses your **Azure CLI credentials**. Before running the app:

```bash
az login
```

This opens a browser for Microsoft authentication. Once logged in, the app will use these credentials automatically.

---

## Future: App Registration (Optional)

For production deployment without requiring Azure CLI, you can create an App Registration.
This is not needed for development - `az login` is simpler.

See git history for the MSAL-based implementation if needed.

---

## Verify Your Access

To verify you have the right permissions on the Azure resources, run:

```bash
# Check Speech Service access
az cognitiveservices account show --name gemoreno-speech-service --resource-group FHL_2025

# Check OpenAI access
az cognitiveservices account show --name mich-test-agent-resource --resource-group MICHRedmondAzureRG
```

You may also need to ensure your user account has the **"Cognitive Services User"** role on both resources.

---

## Troubleshooting

### "Auth not configured" error
- Make sure you've entered all values in Settings and clicked Save

### Sign-in opens browser but fails
- Ensure the App Registration has "Allow public client flows" enabled
- Check that API permissions are granted

### Speech recognition fails
- Verify the Speech Resource ID is the full path (starts with `/subscriptions/...`)
- Check the region matches your Speech resource location

### OpenAI cleanup fails
- Verify the endpoint URL ends with `/`
- Check the deployment name matches exactly (case-sensitive)
