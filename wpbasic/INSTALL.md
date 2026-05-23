# WPBasic Installation Guide

Quick setup guide for WordPress AI development.

## System Requirements

- **VS Code** 1.85+
- **macOS** 10.15+, **Linux** (Ubuntu 18.04+), or **Windows** 10+
- **Network access** to GPU server: `142.54.161.210:11434`
- **2GB RAM** minimum (4GB+ recommended)

## Installation

### macOS

1. **Download**
   ```bash
   curl -O https://releases.rochastudios.ai/wpbasic/wpbasic-latest-macos.tar.gz
   tar -xzf wpbasic-latest-macos.tar.gz
   ```

2. **Run**
   ```bash
   cd wpbasic
   ./VS\ Code\ Ollama.app/Contents/MacOS/Electron /path/to/wordpress
   ```

3. **Optional: Create Alias**
   ```bash
   alias wpbasic="/path/to/wpbasic/VS\ Code\ Ollama.app/Contents/MacOS/Electron"
   wpbasic /path/to/wordpress
   ```

### Linux

1. **Download**
   ```bash
   wget https://releases.rochastudios.ai/wpbasic/wpbasic-latest-linux.tar.gz
   tar -xzf wpbasic-latest-linux.tar.gz
   ```

2. **Run**
   ```bash
   cd wpbasic
   ./code /path/to/wordpress
   ```

3. **Optional: Create Symlink**
   ```bash
   sudo ln -s /path/to/wpbasic/code /usr/local/bin/wpbasic
   wpbasic /path/to/wordpress
   ```

### Windows

1. **Download**
   - [wpbasic-latest-windows.zip](https://releases.rochastudios.ai/wpbasic/)

2. **Extract**
   ```cmd
   REM Use Windows Explorer or:
   powershell Expand-Archive wpbasic-latest-windows.zip -DestinationPath .
   ```

3. **Run**
   ```cmd
   cd wpbasic
   code.bat C:\path\to\wordpress
   ```

4. **Optional: Add to PATH**
   - Add `wpbasic` folder to Windows PATH
   - Then: `wpbasic C:\path\to\wordpress`

## Initial Configuration

### 1. Verify GPU Connection

```
Command Palette (Cmd+Shift+P) → "WPBasic: Check GPU Server Status"
```

Should show: ✅ Ollama connected with qwen3:14b loaded

### 2. Apply WordPress Settings

WPBasic comes pre-configured, but you can customize:

```
Settings (Cmd+,) → Search "wpbasic"
```

Key settings:
- `wpbasic.host` — GPU server address (default: 142.54.161.210)
- `wpbasic.model` — AI model (default: qwen3:14b)
- `wpbasic.temperature` — Code precision (0.3 = precise PHP)
- `wpbasic.qaSecurityFocus` — Security checking (true = strict)

### 3. Open Your WordPress Project

```bash
# Theme development
wpbasic /path/to/wp-content/themes/my-theme

# Plugin development
wpbasic /path/to/wp-content/plugins/my-plugin

# Full WordPress install
wpbasic /path/to/wordpress
```

### 4. Start Using AI Completions

Begin typing PHP code:

```php
<?php
add_action('wp_footer', function() {
  // Press Ctrl+Space or Cmd+Space
  // WPBasic suggests WordPress-aware completions
});
```

## First-Time Tips

### 1. Disable OnSave Formatting (Optional)

If completions slow down typing:

```json
"editor.formatOnSave": false
```

### 2. Customize Context Window

For better WordPress understanding:

```json
"wpbasic.contextLines": 150
```

### 3. Enable Daily Tips

Get WordPress development advice:

```
Command Palette → "WPBasic: Show Daily Tips"
```

### 4. Check Security QA

Verify it's catching security issues:

```
Command Palette → "WPBasic: Toggle Code Quality Analysis"
```

## Updating WPBasic

### Check for Updates

```
Help → Check for Updates
```

### Manual Update

1. Download latest from https://releases.rochastudios.ai/wpbasic/
2. Extract to new location
3. Switch alias/PATH to point to new version

## Troubleshooting

### Issue: "No completions appearing"

**Check GPU Connection:**
```bash
curl http://142.54.161.210:11434/api/tags
```

Should return JSON with models.

**Check Model Loaded:**
```bash
# SSH to GPU server and verify
ollama list | grep qwen3:14b
```

**Verify Settings:**
```
Command Palette → "WPBasic: Check GPU Server Status"
```

---

### Issue: "Completions are slow"

**Reduce Context:**
```json
"wpbasic.contextLines": 50
```

**Reduce Tokens:**
```json
"wpbasic.maxTokens": 75
```

**Increase Debounce:**
```json
"wpbasic.debounceMs": 500
```

---

### Issue: "QA shows too many/few warnings"

**Too Strict:**
```json
"wpbasic.qaSecurityFocus": false
```

**Too Lenient:**
```json
"wpbasic.qaSecurityFocus": true
```

---

### Issue: "Connection refused"

**Check firewall:**
```bash
# Can you ping the GPU server?
ping 142.54.161.210

# Can you reach the port?
telnet 142.54.161.210 11434
```

**Check GPU server is running:**
```bash
ssh root@142.54.161.210
ollama serve
```

**Try localhost (local testing):**
```json
"wpbasic.host": "http://localhost"
"wpbasic.port": 11434
```

## Performance Tuning

### For Slow Networks

```json
{
  "wpbasic.debounceMs": 500,
  "wpbasic.maxTokens": 50,
  "wpbasic.temperature": 0.1,
  "wpbasic.contextLines": 50
}
```

### For Fast Networks

```json
{
  "wpbasic.debounceMs": 100,
  "wpbasic.maxTokens": 150,
  "wpbasic.contextLines": 150
}
```

### For Large WordPress Sites

```json
{
  "wpbasic.contextLines": 100,
  "wpbasic.temperature": 0.2,
  "wpbasic.debounceMs": 400
}
```

## Theme/Plugin Development Specific

### For Theme Development

```json
{
  "wpbasic.contextLines": 75,
  "wpbasic.temperature": 0.3,
  "[php]": {
    "editor.wordBasedSuggestions": false
  }
}
```

### For Plugin Development

```json
{
  "wpbasic.contextLines": 100,
  "wpbasic.temperature": 0.2,
  "wpbasic.qaSecurityFocus": true
}
```

### For Content Creation

```json
{
  "wpbasic.temperature": 0.7,
  "wpbasic.maxTokens": 300
}
```

## Next Steps

1. ✅ Verify GPU connection
2. ✅ Open WordPress project
3. ✅ Start typing PHP code
4. ✅ Enable Daily Tips
5. ✅ Configure security QA

## Support

- 📖 **Full Docs**: [../docs/WORDPRESS_INTEGRATION.md](../docs/WORDPRESS_INTEGRATION.md)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/alejandrodelarocha/vscode-ollama-fork/issues)
- 📚 **Architecture**: [../OLLAMA_INTEGRATION.md](../OLLAMA_INTEGRATION.md)
- 🎨 **Logo Info**: [../LOGO_DESIGN.md](../LOGO_DESIGN.md)

---

**Ready?** Open your WordPress project and start developing with AI!

```bash
wpbasic /path/to/wordpress
```
