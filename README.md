# Fluent

A Windows desktop app for voice-to-text dictation using Azure Speech-to-Text and Azure OpenAI.

## Features

- **Hotkey activation**: Press `Ctrl+Shift+Space` to toggle recording
- **Speech-to-text**: Azure Speech SDK for continuous recognition
- **AI cleanup**: Azure OpenAI cleans up transcripts (removes fillers, adds punctuation)
- **Auto-paste**: Automatically pastes cleaned text into the active application
- **Secure auth**: Microsoft Entra ID authentication (no API keys stored)

## Prerequisites

### Azure Resources

1. **Azure App Registration** (Entra ID)
   - Go to Azure Portal > Microsoft Entra ID > App registrations > New registration
   - Name: "Fluent" (or any name)
   - Supported account types: Single tenant (or as needed)
   - Redirect URI: Leave blank for now
   - After creation:
     - Go to Authentication > Add a platform > Mobile and desktop applications
     - Add redirect URI: `msal{your-client-id}://auth`
     - Enable "Allow public client flows"
   - Go to API permissions:
     - Add permission > Azure Cognitive Services > user_impersonation
     - Grant admin consent

2. **Azure Speech Service**
   - Create a Speech resource in Azure Portal
   - Note the Resource ID (from Properties blade)
   - Note the Region (e.g., eastus)

3. **Azure OpenAI Service**
   - Create an Azure OpenAI resource
   - Deploy a model (e.g., gpt-4o-mini)
   - Note the Endpoint and Deployment name
   - Ensure your user has "Cognitive Services OpenAI User" role on the resource

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run the app
npm start
```

## Configuration

On first run, the app will prompt you to configure settings. You can also access settings from the system tray menu.

Required settings:
- **Client ID**: From your Azure App Registration
- **Tenant ID**: Your Azure AD tenant ID
- **Speech Resource ID**: Full resource ID of your Speech service
- **Speech Region**: Region of your Speech service (e.g., eastus)
- **OpenAI Endpoint**: Your Azure OpenAI endpoint URL
- **OpenAI Deployment Name**: Name of your deployed model

## Usage

1. Sign in via the system tray menu
2. Press `Ctrl+Shift+Space` to start recording
3. Speak your text
4. Press `Ctrl+Shift+Space` again to stop
5. The cleaned text is automatically pasted into the active application

## Building for Distribution

```bash
# Build Windows installer
npm run dist:win
```

The installer will be created in the `release/` folder.

## Tech Stack

- **Electron**: Desktop application framework
- **TypeScript**: Type-safe code
- **@azure/msal-node**: Microsoft Entra ID authentication
- **microsoft-cognitiveservices-speech-sdk**: Azure Speech SDK
- **openai**: Azure OpenAI SDK
