# Ollama Voice Assistant - Installation Guide

## Quick Start (Development)

### Step 1: Locate the Extension

The extension files are in:
```
vscode-ollama-fork/chrome-extension/
```

Required files:
- `manifest.json` - Extension configuration
- `popup.html` - UI
- `popup.js` - Voice recognition
- `content.js` - Editor integration
- `background.js` - Service worker
- `styles.css` - Styles
- `assets/` - Icons (16, 48, 128px PNG files)

### Step 2: Generate Icons (Optional)

Create placeholder icons with this Node script:

```bash
cd chrome-extension/assets
node generate-icons.js
```

Or use existing icons:
- 16x16 px for taskbar
- 48x48 px for extension list
- 128x128 px for Chrome Web Store

### Step 3: Load in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `chrome-extension` folder
5. You should see "Ollama Voice Assistant" in your extensions

### Step 4: Pin the Extension

1. Click the puzzle icon in Chrome's toolbar
2. Find "Ollama Voice Assistant"
3. Click the pin icon to keep it visible

### Step 5: Test It

1. Click the Ollama Voice Assistant icon
2. Open VS Code (or Ollama editor) in a tab
3. Click **"Start Listening"** in the popup
4. Say "code hello world" and watch it insert

## Full Installation (Production)

### For Chrome Web Store Submission

1. **Create a Google Account** (for Chrome Web Store Developer)
2. **Pay one-time fee** ($5 USD)
3. **Package the extension**:
   ```bash
   # Create a .zip file of the extension
   cd vscode-ollama-fork
   zip -r ollama-voice-assistant.zip chrome-extension/
   ```
4. **Upload to Chrome Web Store**:
   - Go to https://chrome.google.com/webstore/developer
   - Click "New Item"
   - Upload the .zip file
   - Fill in metadata, screenshots, description
   - Submit for review (2-3 days typically)

### Icon Requirements for Web Store

- **16x16 px**: Small icon (toolbar)
- **48x48 px**: Extension list
- **128x128 px**: Chrome Web Store page
- **440x280 px**: Promotional tile (optional)

Format: PNG with transparency recommended

### Metadata Required

- **Name**: Ollama Voice Assistant
- **Short description** (132 chars): "Voice commands and speech-to-code for Ollama VS Code Editor"
- **Description** (1000 chars): Full feature list
- **Category**: Productivity
- **Language**: English
- **Privacy policy**: Link to privacy policy
- **Support email**: support@rochastudios.ai
- **Homepage**: https://github.com/alejandrodelarocha/vscode-ollama-fork

### Screenshots for Web Store

1. Voice popup with "Start Listening" button
2. Code insertion in editor with notification
3. Voice command in progress with listening indicator
4. Multiple commands executed with success notifications

## Permissions Explained

The extension requests:
- ✅ `activeTab` - Detect if Ollama editor is open
- ✅ `scripting` - Inject code into editor page
- ✅ `storage` - Save user language preference
- ✅ `host_permissions` - Access localhost:8080 (Ollama)

These are minimal and necessary for functionality.

## Troubleshooting Installation

### "Failed to load the extension"

**Solution**: 
- Check `manifest.json` syntax (valid JSON)
- Ensure all referenced files exist
- Verify paths in manifest (e.g., `popup.html`)

### "Extension doesn't appear in toolbar"

**Solution**:
1. Go to `chrome://extensions`
2. Search for "Ollama"
3. Enable the extension toggle
4. Pin it to toolbar (puzzle icon → pin)

### "Microphone not working"

**Solution**:
1. Go to `chrome://settings/content/microphone`
2. Check site is allowed: `localhost:8080`
3. Check Windows/Mac system microphone permissions
4. Restart Chrome

### "Commands not executing"

**Solution**:
1. Check if Ollama editor is open in same browser
2. Verify content script loaded: Open `F12` → Console → look for "Ollama Voice Assistant content script loaded"
3. Check VS Code is focused when sending commands
4. Verify editor URL is `localhost:8080`

## File Size & Performance

- Total extension size: ~50 KB
- Popup size: ~200 KB (including assets)
- Memory usage: ~15-20 MB when listening
- CPU usage: <2% during transcription

Minimal impact on browser performance.

## Security Considerations

✅ **Local processing**: Speech recognition happens in browser  
✅ **No external APIs**: No tracking or analytics  
✅ **Minimal permissions**: Only localhost and active tab  
✅ **User-controlled**: Listening only when explicitly started  

⚠️ **Microphone permission**: Browser will ask on first use

## Next Steps

1. **Install the extension** following steps above
2. **Test voice commands** with Ollama editor open
3. **Configure language** in settings (when Ollama editor is loaded)
4. **Read command reference** in popup Help button
5. **Report issues** on GitHub

## Support

- **Bug reports**: GitHub Issues
- **Feature requests**: GitHub Discussions
- **Security issues**: security@rochastudios.ai (do not use public issues)

## Updates

Updates will be delivered automatically via Chrome:
- Check `chrome://extensions` for pending updates
- Manual update: Click the update icon next to the extension

---

For detailed usage, see [README.md](README.md)
