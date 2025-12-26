# Direct Typing Feature

## Overview

Added a setting to type text directly using OS shell commands instead of clipboard paste.

## Changes Made

### Files Modified

| File | Change |
|------|--------|
| `src/shared/types.ts` | Added `useDirectTyping: boolean` to `PreferencesConfig` |
| `src/main/modules/config/config-store.ts` | Added default `useDirectTyping: false` |
| `src/main/modules/clipboard/paste-service.ts` | Added `typeText()`, `insertText()`, and platform-specific escape functions |
| `src/main/app.ts` | Uses `pasteService.insertText()` instead of `clipboard.writeText()` |
| `src/renderer/settings.html` | Added checkbox in Preferences section |

### Platform Implementation

| OS | Command | Special Characters Escaped |
|----|---------|---------------------------|
| macOS | `osascript -e 'tell application "System Events" to keystroke "..."'` | `\` `"` |
| Windows | PowerShell `SendKeys('...')` | `+ ^ % ~ ( ) { } [ ]` |
| Linux | `xdotool type -- "..."` | `\ " $ \`` |

Newlines are handled separately:
- macOS: `keystroke return` between text segments
- Windows: `{ENTER}` in SendKeys
- Linux: xdotool handles newlines natively

## Implications

### Pros
- Does not modify the user's clipboard
- Works in applications that don't support paste

### Cons
- **Slower**: ~500ms-2s for 100 characters vs ~50-100ms for clipboard paste
- Shell process spawning overhead for each operation
- macOS requires multiple shell calls for multi-line text
- Special characters need careful escaping per platform

### Performance Characteristics

The OS simulates keystrokes internally, not truly "instant" like clipboard paste:
- macOS: System Events simulates sequential key presses
- Windows: SendKeys simulates keystrokes internally
- Linux: xdotool has ~12ms default delay between keystrokes

## Alternative: Native Packages

For better performance, consider using native keyboard simulation packages:

### nut.js
```bash
npm install @nut-tree/nut-js
```
- Modern, actively maintained
- Cross-platform (Windows, macOS, Linux)
- Faster keystroke simulation without shell overhead
- Supports typing strings directly

### robotjs
```bash
npm install robotjs
```
- Mature, widely used
- Requires native compilation (node-gyp)
- May have compatibility issues with newer Node/Electron versions

### Trade-offs

| Approach | Speed | Dependencies | Complexity |
|----------|-------|--------------|------------|
| Shell commands (current) | Slow | None | Low |
| nut.js | Fast | Native module | Medium |
| robotjs | Fast | Native module + build tools | Medium |

The current shell-based approach was chosen to avoid native module compilation complexity and keep dependencies minimal.
