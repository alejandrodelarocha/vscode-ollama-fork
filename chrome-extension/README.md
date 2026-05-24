# Ollama Voice Assistant - Chrome Extension

Voice-to-code and voice commands for the Ollama VS Code Editor.

## Features

- **Speech-to-Text**: Use Chrome's native Web Speech API for accurate voice recognition
- **Voice Commands**: Control the editor with natural language commands
- **Code Insertion**: Speak code and have it inserted directly into the editor
- **Real-time Feedback**: Visual status indicators and notifications
- **Command Reference**: Built-in help with common voice commands

## Installation

### Development Mode

1. Clone or download the extension files to a local folder
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `chrome-extension` directory
6. The Ollama Voice Assistant should appear in your extensions list

### Production (Chrome Web Store)

Coming soon.

## Usage

### Starting the Extension

1. Click the Ollama Voice Assistant icon in your Chrome toolbar
2. A popup window will appear showing voice control options
3. Click **"Start Listening"** to begin voice recognition

### Voice Commands

| Command | Action |
|---------|--------|
| `code [text]` | Insert code directly into the editor |
| `complete` | Request an Ollama completion |
| `toggle ollama` | Enable/disable Ollama completions |
| `check status` | Check Ollama connection status |
| `qa` | Toggle auto QA analysis |

### Examples

- **Speak**: "code function hello() { return 'world'; }"
  → Inserts the function into your editor

- **Speak**: "toggle ollama"
  → Enables or disables completions

- **Speak**: "complete"
  → Requests a completion at cursor position

## Configuration

### Language Settings

The extension defaults to English (US). To change:

1. Click the extension popup
2. Click **"⚙️ Settings"** (when implemented)
3. Select your preferred language

Supported languages:
- English (US)
- English (GB)
- Spanish (ES)
- French (FR)
- German (DE)
- Chinese (Simplified)
- Japanese
- Portuguese (BR)

### Auto-Send

By default, commands are automatically processed. To disable:

1. Open extension settings
2. Toggle "Auto-send commands" off

## How It Works

### Architecture

```
Chrome Extension (popup.js)
    ↓ (Web Speech API)
Browser Speech Recognition
    ↓ (Parsed command)
Content Script (content.js)
    ↓ (Message passing)
Ollama Editor / VS Code Commands
```

### Web Speech API

The extension uses Chrome's native Web Speech API (`SpeechRecognition`):
- No external APIs or API keys required
- Works offline for speech recognition
- Accurate transcription with real-time feedback
- Continuous listening mode for multi-word input

### Command Processing

1. **Recognition**: Voice is transcribed to text
2. **Parsing**: Text is analyzed for command patterns
3. **Execution**: Matched command is executed in the editor
4. **Feedback**: Visual notification confirms the action

## Troubleshooting

### "No input captured"

- Ensure your microphone is enabled in Chrome:
  1. Go to `chrome://settings/content/microphone`
  2. Verify the site is allowed to access your microphone
  3. Check system microphone permissions

### "Listening..." but nothing happens

- Speak clearly and naturally
- Wait for the "Listening..." state before speaking
- Use complete words and phrases
- Check the transcript display for accuracy

### Commands not working

- Verify Ollama VS Code is open and active
- Check that the editor is focused
- Ensure the command syntax matches (case-insensitive)
- Check browser console for errors (`Ctrl+Shift+J`)

### Connection errors

- Ensure Ollama server is running at `http://localhost:8080`
- Verify network connectivity
- Check firewall settings allow localhost connections

## File Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── popup.html         # UI for voice controls
├── popup.js           # Voice recognition logic
├── content.js         # Editor integration
├── background.js      # Service worker
├── styles.css         # UI styling
├── assets/            # Icons and images
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md          # This file
```

## Permissions

The extension requests minimal permissions:

- `activeTab`: Access current tab for voice commands
- `scripting`: Inject code into the editor page
- `storage`: Save user preferences
- `host_permissions`: localhost:8080 for Ollama editor

## Security & Privacy

- All speech recognition is processed by Chrome's native API
- No audio is sent to external servers
- No tracking or analytics
- User preferences stored locally in browser

## Development

### Building for Production

```bash
cd chrome-extension
# Files are already in correct format
# Package as .crx for Chrome Web Store submission
```

### Testing Changes

1. Make edits to popup.js, content.js, or manifest.json
2. Go to `chrome://extensions`
3. Click the refresh icon on the Ollama Voice Assistant card
4. Test the changes in a Chrome tab

### Debugging

Open browser console (`Ctrl+Shift+J`) to see:
- Speech recognition events
- Command processing logs
- Content script messages
- Error messages

## Keyboard Shortcuts (Future)

- `Ctrl+Shift+V`: Toggle listening (coming in v1.1)
- `Alt+V`: Open voice popup (coming in v1.1)

## Changelog

### v1.0.0 (Current)

- Initial release
- Voice recognition with Web Speech API
- 5 core voice commands
- Real-time feedback and notifications
- Chrome extension UI with status display

### v1.1.0 (Planned)

- Keyboard shortcuts for activation
- Additional voice commands
- Language selection UI
- Settings persistence
- Command history

### v1.2.0 (Planned)

- Voice macro recording
- Custom command creation
- Multi-language support improvements
- Enhanced error handling

## Contributing

Found a bug? Have a feature request? Open an issue or submit a PR.

## License

MIT License - See LICENSE file in the main repository

## Support

For issues, feature requests, or questions:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Ensure latest version is installed
4. Contact: support@rochastudios.ai

## Acknowledgments

- Built with Chrome's Web Speech API
- Part of the Ollama VS Code Fork project
- Inspired by voice-first development tools

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Status**: Stable Release
