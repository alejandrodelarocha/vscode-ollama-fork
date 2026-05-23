# VS Code Ollama Fork

**AI-powered code completion using local Ollama models on GPU**

Fork of [microsoft/vscode](https://github.com/microsoft/vscode) with integrated Ollama code completion provider. Uses qwen3:14b running on GPU server (142.54.161.210:11434) for fast, private code suggestions.

## Features

✨ **AI Code Completion** — Get intelligent code suggestions as you type
🚀 **GPU-Accelerated** — Fast inference on dedicated GPU server
🔒 **Fully Private** — No external APIs, all computation stays local
⚙️ **Customizable** — Adjust models, temperature, context window
🛠️ **Zero Setup** — Works with any language VS Code supports
💾 **Low Overhead** — Minimal latency, responsive editing experience

## Quick Start

### Prerequisites
- macOS 10.15+, Linux (Ubuntu 18.04+), or Windows 10+
- Access to GPU server: 142.54.161.210:11434 (Ollama running qwen3:14b)
- Network connectivity to GPU server

### Install

1. **Download pre-built binary** for your OS:
   - [macOS](https://releases.rochastudios.ai/vscode-ollama/latest-macos.zip)
   - [Linux](https://releases.rochastudios.ai/vscode-ollama/latest-linux.tar.gz)
   - [Windows](https://releases.rochastudios.ai/vscode-ollama/latest-windows.zip)

2. **Extract and run:**
   ```bash
   unzip vscode-ollama-macos.zip
   ./VS\ Code.app/Contents/MacOS/Electron
   ```

3. **Configure GPU server** (if not 142.54.161.210):
   - Settings → Extensions → VS Code Ollama
   - Set Ollama Host to your server IP
   - Reload window

Done! Start typing and watch Ollama complete your code.

## Configuration

### VS Code Settings (`.vscode/settings.json`)

```json
{
  "vscodeOllama.enabled": true,
  "vscodeOllama.host": "http://142.54.161.210",
  "vscodeOllama.port": 11434,
  "vscodeOllama.model": "qwen3:14b",
  "vscodeOllama.temperature": 0.3,
  "vscodeOllama.maxTokens": 100,
  "vscodeOllama.contextLines": 50,
  "vscodeOllama.debounceMs": 300,
  "vscodeOllama.timeout": 5000
}
```

### Environment Variables

```bash
export OLLAMA_HOST=http://142.54.161.210:11434
export VSCODE_OLLAMA_MODEL=qwen3:14b
export VSCODE_OLLAMA_ENABLED=true
```

## Building from Source

### Prerequisites
```bash
node --version  # v18+
npm --version   # v8+
git clone https://github.com/alejandrodelarocha/vscode-ollama-fork.git
cd vscode-ollama-fork
```

### Build
```bash
npm install
npm run compile

# Build distribution
npm run build
./scripts/build.sh --macos      # macOS
./scripts/build.sh --linux      # Linux
./scripts/build.sh --windows    # Windows
```

### Run Development Build
```bash
export OLLAMA_HOST=http://142.54.161.210:11434
npm run watch
./scripts/code.sh               # Launch dev build
```

## How It Works

1. **You type code** → Cursor triggers completion request
2. **Context extracted** → Analyzer reads ±50 lines of surrounding code
3. **Prompt constructed** → Context formatted for Ollama
4. **GPU processes** → qwen3:14b generates completions (~500-1000ms)
5. **Suggestions shown** → Top completions appear in editor
6. **You select** → Press Tab to accept, Esc to dismiss

## Supported Languages

- JavaScript / TypeScript
- Python
- Java
- C / C++ / C#
- Go
- Rust
- PHP
- And all other VS Code languages

## Performance

| Metric | Value |
|--------|-------|
| Avg latency | 500-1500ms |
| Model | qwen3:14b |
| Context | ~1000 tokens |
| GPU | NVIDIA (CUDA) |
| Throughput | 20-30 completions/min |

## Themes

Choose from 4 built-in themes optimized for code completion visibility:

- **Ollama Dark** — Default dark theme with cyan completion highlights
- **Ollama Light** — Light theme for daytime coding
- **Ollama High Contrast Light** — Maximum contrast for accessibility
- **Ollama High Contrast Dark** — High-contrast dark mode with vibrant syntax colors

Select via Preferences → Color Theme, or set in `.vscode/settings.json`:

```json
{
  "workbench.colorTheme": "Ollama Dark"
}
```

## Auto QA (Code Quality Analysis)

Real-time code quality checking powered by Ollama. Automatically analyzes your code and highlights issues.

### Features
- **Real-time analysis** — Scans code as you type
- **Issue detection** — Finds errors, warnings, and code smells
- **No external APIs** — Runs locally on your GPU server
- **Smart caching** — Reuses analysis results for unchanged code

### Configuration

Enable/disable in settings:

```json
{
  "vscodeOllama.qaEnabled": true,
  "vscodeOllama.qaTimeout": 10000
}
```

### Commands

- `Ollama: Toggle Ollama Auto QA` — Enable/disable code quality analysis
- `Ollama: Check Ollama Status` — Verify connection to Ollama server

## Daily Suggestions (Lovable-Style)

Get 5 contextual tips and feature suggestions each day, spaced throughout your workflow.

### What You'll See
- ✨ Feature discovery prompts
- ⚙️ Configuration recommendations
- 📚 Tips for better completions
- 🎨 Theme and appearance suggestions
- 💡 Productivity hacks

### Control It
```json
{
  "vscodeOllama.showDailySuggestions": true
}
```

Suggestions appear:
- First one: 5 minutes after startup
- Then: One per hour (max 5/day)
- Resets: Midnight each day
- Click "Try it" to apply the suggestion instantly

## Troubleshooting

### "No completions appearing"
```bash
# Check Ollama is running
curl http://142.54.161.210:11434/api/tags

# Check model is loaded
ollama list | grep qwen3:14b

# Verify config
cat ~/.vscode-ollama/config.json
```

### "Very slow completions"
- Reduce `contextLines` (50 → 25)
- Reduce `maxTokens` (100 → 50)
- Increase `debounceMs` (300 → 500)
- Check GPU load: `nvidia-smi`

### "Connection refused"
- Verify firewall allows 142.54.161.210:11434
- Check GPU server is running: `ssh root@142.54.161.210 ollama serve`
- Try with `localhost:11434` if testing locally

## Models

Swap models in settings. Some alternatives:

| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| qwen3:14b | 🟡 Medium | ⭐⭐⭐⭐⭐ | **Default** |
| mistral:7b | 🟢 Fast | ⭐⭐⭐⭐ | Quick completions |
| neural-chat | 🟡 Medium | ⭐⭐⭐⭐ | Code-optimized |
| llama3.1:70b | 🔴 Slow | ⭐⭐⭐⭐⭐ | Best quality |

## Contributing

1. Fork this repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes & test: `npm run test`
4. Commit: `git commit -am 'Add my feature'`
5. Push: `git push origin feature/my-feature`
6. PR to main branch

## License

MIT (same as VS Code)

## Credits

- **VS Code** — microsoft/vscode
- **Ollama** — jmorganca/ollama  
- **Built by** — Rocha Studios
- **GPU Infrastructure** — Powered by qwen3:14b on dedicated GPU

## Links

- 🐙 GitHub: https://github.com/alejandrodelarocha/vscode-ollama-fork
- 📊 Issues: https://github.com/alejandrodelarocha/vscode-ollama-fork/issues
- 📚 Docs: ./OLLAMA_INTEGRATION.md
- 🚀 Releases: https://releases.rochastudios.ai/vscode-ollama/

---

**Ready to code with AI?** [Download Latest](https://releases.rochastudios.ai/vscode-ollama/latest) • [Build from Source](#building-from-source) • [Configure Settings](#configuration)

Made with ❤️ for developers who want private, fast, GPU-powered code completion.
