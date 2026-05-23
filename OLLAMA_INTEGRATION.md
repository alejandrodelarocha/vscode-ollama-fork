# VS Code Ollama Integration

## Overview
This fork of VS Code integrates Ollama for AI-powered code completion, replacing the default IntelliSense with local LLM inference.

## Configuration

### GPU Server Connection
- **Host:** 142.54.161.210
- **Port:** 11434
- **Model:** qwen3:14b
- **Environment Variables:**
  - `OLLAMA_HOST=http://142.54.161.210:11434`
  - `VSCODE_OLLAMA_MODEL=qwen3:14b`
  - `VSCODE_OLLAMA_ENABLED=true`

### Features
1. **Code Completion** — inline suggestions as you type
2. **Context-Aware** — analyzes surrounding code for relevant completions
3. **Low Latency** — GPU-accelerated inference
4. **No External APIs** — fully local, runs on private GPU

## Modified Files

### Core Changes
- `src/vs/editor/contrib/inlineCompletions/` — IntelliSense provider
- `src/vs/editor/common/languages.ts` — Language service integration
- `src/vs/workbench/services/textmodelResolver/` — Code analysis
- `src/vs/code/node/cli.ts` — Configuration handling

### New Files
- `src/vs/editor/contrib/ollama/ollamaProvider.ts` — Ollama API client
- `src/vs/editor/contrib/ollama/ollamaCompletion.ts` — Completion logic
- `src/vs/editor/contrib/ollama/contextAnalyzer.ts` — Code context extraction

## Building

### Prerequisites
- Node.js 18+
- Python 3.8+ (for build scripts)
- Git
- Access to GPU server (142.54.161.210)

### Build Steps
```bash
git clone https://github.com/YOUR_USERNAME/vscode-ollama-fork.git
cd vscode-ollama-fork
npm install
npm run compile
./scripts/build.sh
```

### Run Locally
```bash
export OLLAMA_HOST=http://142.54.161.210:11434
export VSCODE_OLLAMA_MODEL=qwen3:14b
./scripts/code.sh
```

## Architecture

### Request Flow
1. User types code → editor triggers completion request
2. Context analyzer extracts surrounding code (±50 lines)
3. Completion engine constructs prompt with context
4. Request sent to Ollama on GPU server
5. qwen3:14b generates completions
6. Top 5 suggestions returned to editor
7. User selects or dismisses suggestion

### Performance
- **Latency:** ~500-1500ms per completion (GPU-accelerated)
- **Throughput:** ~20-30 completions/minute
- **Memory:** ~2GB in editor process

## Configuration Files

### `.vscode-ollama/config.json`
```json
{
  "ollama": {
    "enabled": true,
    "host": "http://142.54.161.210",
    "port": 11434,
    "model": "qwen3:14b",
    "timeout": 5000,
    "maxTokens": 100,
    "temperature": 0.3,
    "contextLines": 50,
    "debounceMs": 300
  }
}
```

## Deployment

### Pre-built Binaries
- macOS: `vscode-ollama-1.0.0-macos-x64.zip`
- Linux: `vscode-ollama-1.0.0-linux-x64.tar.gz`
- Windows: `vscode-ollama-1.0.0-windows-x64.zip`

### Installation
1. Download binary for your OS
2. Extract to desired location
3. Create `~/.vscode-ollama/config.json` with GPU server details
4. Run `./code` (macOS/Linux) or `code.exe` (Windows)

## Customization

### Using Different Models
Edit `config.json` and change `model` field:
- `qwen3:14b` (default, balanced)
- `mistral:7b` (faster, less accurate)
- `neural-chat:latest` (optimized for code)
- `llama3.1:70b` (slower, most accurate)

### Adjusting Completion Behavior
- `temperature`: 0.1-0.9 (lower = more deterministic)
- `maxTokens`: 50-200 (longer suggestions)
- `contextLines`: 20-100 (more context = slower)
- `debounceMs`: 100-1000 (delay before request)

## Troubleshooting

### No Completions Showing
1. Check GPU server is running: `curl http://142.54.161.210:11434/api/tags`
2. Verify model is loaded: `ollama list | grep qwen3:14b`
3. Check config: `cat ~/.vscode-ollama/config.json`
4. Check logs: `~/.vscode-ollama/logs/vscode-ollama.log`

### Slow Completions
1. Reduce `contextLines` in config
2. Reduce `maxTokens` for shorter suggestions
3. Increase `debounceMs` to reduce request frequency
4. Check GPU server load: `nvidia-smi`

### Connection Errors
1. Verify firewall allows 142.54.161.210:11434
2. SSH to GPU server: `ssh root@142.54.161.210`
3. Test Ollama: `curl http://localhost:11434/api/generate -d '{"model":"qwen3:14b","prompt":"test"}'`

## Development

### Contributing
1. Fork this repo
2. Create feature branch
3. Implement changes
4. Test locally with GPU server
5. Submit PR with description

### Testing
```bash
npm run test
npm run test:ollama # Ollama-specific tests
npm run test:integration # GPU server integration tests
```

## License
MIT (same as VS Code)

## Credits
- VS Code team (microsoft/vscode)
- Ollama project (jmorganca/ollama)
- Built by Rocha Studios
