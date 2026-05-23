#!/bin/bash

###############################################################################
# WPBasic Distribution Builder
# Creates WordPress-optimized distribution from base VS Code Ollama
###############################################################################

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${PROJECT_ROOT}/dist"
WPBASIC_DIR="${PROJECT_ROOT}/wpbasic"
WPBASIC_DIST="${DIST_DIR}/wpbasic"
VERSION=$(grep '"version"' "${PROJECT_ROOT}/wpbasic/package.json" | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  WPBasic Distribution Builder                              ║${NC}"
echo -e "${BLUE}║  WordPress-Optimized VS Code Ollama ${VERSION}                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

# Create WPBasic distributions
create_wpbasic_dist() {
  log_info "Creating WPBasic distributions..."

  mkdir -p "${WPBASIC_DIST}"

  # Copy base binaries and rebrand as WPBasic
  for file in "${DIST_DIR}"/vscode-ollama-*.{tar.gz,zip}; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      wpbasic_filename="${filename/vscode-ollama/wpbasic}"

      log_info "Creating: $wpbasic_filename"
      cp "$file" "${WPBASIC_DIST}/$wpbasic_filename"
    fi
  done

  log_success "WPBasic distributions created"
}

# Create WPBasic release notes
create_release_notes() {
  log_info "Creating WPBasic release notes..."

  cat > "${WPBASIC_DIST}/RELEASE_NOTES.md" << EOF
# WPBasic ${VERSION} - WordPress AI Development

**AI-powered code completion optimized for WordPress developers**

## What's New

### Core Features
✨ **WordPress-Aware Completions** — Understands PHP, hooks, template tags, WP functions
🔒 **Security-First QA** — Detects escaping, sanitization, XSS, injection risks
⚡ **GPU-Accelerated** — Sub-second completions on dedicated GPU server
📝 **Theme/Plugin Dev** — Complete support for custom post types, taxonomies, REST APIs
💡 **Daily Tips** — WordPress development best practices and patterns

### This Release
- 🎨 Professional UI with persistent sidebar suggestion panel
- 🎯 WordPress-specific code quality analysis
- 📚 Comprehensive WordPress integration documentation
- 🔧 Pre-optimized configuration for WordPress development
- 🚀 Multi-platform binaries (macOS, Linux, Windows)

## Installation

### macOS
\`\`\`bash
tar -xzf wpbasic-${VERSION}-macos.tar.gz
./wpbasic/VS\ Code\ Ollama.app/Contents/MacOS/Electron /path/to/wordpress
\`\`\`

### Linux
\`\`\`bash
tar -xzf wpbasic-${VERSION}-linux.tar.gz
./wpbasic/code /path/to/wordpress
\`\`\`

### Windows
\`\`\`cmd
REM Extract wpbasic-${VERSION}-windows.zip, then:
cd wpbasic
code.bat C:\path\to\wordpress
\`\`\`

## Quick Start

1. **Install WPBasic** (see above)
2. **Verify GPU** — Command Palette → "WPBasic: Check GPU Server Status"
3. **Open WordPress** — \`wpbasic /path/to/wordpress\`
4. **Start Coding** — Begin typing PHP and get instant suggestions

## What's Included

✅ AI code completion (Ollama qwen3:14b)
✅ Security QA (WordPress-focused)
✅ Daily development tips
✅ 4 color themes (Dark, Light, HC variants)
✅ Pre-configured for WordPress
✅ Full documentation
✅ Sidebar suggestion panel

## Documentation

- 📖 Full Guide: \`docs/WORDPRESS_INTEGRATION.md\`
- ⚙️ Installation: \`wpbasic/INSTALL.md\`
- 🎨 Logo: \`LOGO_DESIGN.md\`

## System Requirements

- VS Code 1.85+
- macOS 10.15+, Linux (Ubuntu 18.04+), or Windows 10+
- Network access to GPU server: 142.54.161.210:11434
- 2GB+ RAM

## Configuration

Default settings optimized for WordPress:

\`\`\`json
{
  "wpbasic.temperature": 0.3,        // Precise PHP
  "wpbasic.contextLines": 100,       // WordPress context
  "wpbasic.qaSecurityFocus": true,   // Security checks
  "wpbasic.showDailySuggestions": true
}
\`\`\`

## Support

- 🐛 Issues: https://github.com/alejandrodelarocha/vscode-ollama-fork/issues
- 📖 Docs: wpbasic/INSTALL.md
- 🚀 GitHub: https://github.com/alejandrodelarocha/vscode-ollama-fork

## License

MIT (same as VS Code)

---

**Made for WordPress developers who want private, fast, GPU-powered code completion.**

🚀 Ready to develop WordPress with AI? Download, install, and start coding!
EOF

  log_success "Release notes created"
}

# Create checksums for WPBasic
create_checksums() {
  log_info "Generating WPBasic checksums..."

  cd "${WPBASIC_DIST}"

  if command -v shasum &> /dev/null; then
    shasum -a 256 wpbasic-*.{tar.gz,zip} > "wpbasic-${VERSION}-checksums.sha256" 2>/dev/null || true
    log_success "Checksums generated"
  fi
}

# Create installation guide
create_install_guide() {
  log_info "Creating quick install guide..."

  cat > "${WPBASIC_DIST}/QUICK_START.txt" << EOF
WPBasic ${VERSION} - Quick Start
================================

1. EXTRACT
   macOS:   tar -xzf wpbasic-${VERSION}-macos.tar.gz
   Linux:   tar -xzf wpbasic-${VERSION}-linux.tar.gz
   Windows: Unzip wpbasic-${VERSION}-windows.zip

2. OPEN WORDPRESS
   macOS:   ./wpbasic/VS\ Code\ Ollama.app/Contents/MacOS/Electron /path/to/wordpress
   Linux:   ./wpbasic/code /path/to/wordpress
   Windows: wpbasic/code.bat C:\path\to\wordpress

3. VERIFY GPU
   Command Palette → "WPBasic: Check GPU Server Status"

4. START CODING
   Open a .php file and press Ctrl+Space (Cmd+Space on Mac)
   WPBasic will suggest WordPress code completions

5. VIEW TIPS
   Command Palette → "WPBasic: Show Daily Tips"
   Get WordPress development advice daily

DOCUMENTATION
==============
Installation:  wpbasic/INSTALL.md
Full Guide:    docs/WORDPRESS_INTEGRATION.md
Logo Details:  LOGO_DESIGN.md

SUPPORT
=======
Issues:  https://github.com/alejandrodelarocha/vscode-ollama-fork/issues
Docs:    https://github.com/alejandrodelarocha/vscode-ollama-fork

Enjoy developing WordPress with AI!
EOF

  log_success "Quick start guide created"
}

# Main execution
main() {
  create_wpbasic_dist
  create_release_notes
  create_checksums
  create_install_guide

  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  WPBasic Build Complete!                                   ║${NC}"
  echo -e "${GREEN}║  Location: ${WPBASIC_DIST}${NC}"
  echo -e "${GREEN}║  Ready for GitHub Release                                   ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Files created:"
  ls -lh "${WPBASIC_DIST}"/
}

main
