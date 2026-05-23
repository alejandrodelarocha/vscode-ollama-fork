#!/bin/bash

###############################################################################
# VS Code Ollama Fork - Build Script
# Builds platform-specific binaries for macOS, Linux, Windows
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/build"
DIST_DIR="${PROJECT_ROOT}/dist"
VERSION=$(grep '"version"' "${PROJECT_ROOT}/package.json" | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  VS Code Ollama Fork - Binary Builder                      ║${NC}"
echo -e "${BLUE}║  Version: ${VERSION}                                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Parse arguments
PLATFORM="${1:-all}"
VERBOSE="${2:-false}"

##############################################################################
# Helper Functions
##############################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

check_command() {
  if ! command -v "$1" &> /dev/null; then
    log_error "Required command not found: $1"
    exit 1
  fi
}

##############################################################################
# Pre-Build Checks
##############################################################################

pre_build_checks() {
  log_info "Running pre-build checks..."

  check_command "npm"
  check_command "node"

  if [ "$PLATFORM" = "macos" ] || [ "$PLATFORM" = "all" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      check_command "xcodebuild"
    fi
  fi

  log_success "Pre-build checks passed"
}

##############################################################################
# Compile TypeScript
##############################################################################

compile_typescript() {
  log_info "Compiling TypeScript..."
  cd "${PROJECT_ROOT}"
  npx tsc -p .
  log_success "TypeScript compiled to ./out"
}

##############################################################################
# Build macOS Binary
##############################################################################

build_macos() {
  log_info "Building macOS binary..."

  if [[ "$OSTYPE" != "darwin"* ]]; then
    log_warning "Not on macOS, skipping macOS build"
    return
  fi

  local MACOS_BUILD="${BUILD_DIR}/macos"
  mkdir -p "${MACOS_BUILD}"

  # For now, create a minimal macOS app structure
  # In production, this would use electron-builder or similar

  local APP_NAME="VS Code Ollama"
  local APP_BUNDLE="${MACOS_BUILD}/${APP_NAME}.app"
  local CONTENTS="${APP_BUNDLE}/Contents"

  mkdir -p "${CONTENTS}/MacOS"
  mkdir -p "${CONTENTS}/Resources"

  # Create Info.plist
  cat > "${CONTENTS}/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>Electron</string>
  <key>CFBundleIdentifier</key>
  <string>ai.rochastudios.vscode-ollama</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>VS Code Ollama</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>NSMainNibFile</key>
  <string>MainMenu</string>
  <key>NSPrincipalClass</key>
  <string>NSApplication</string>
</dict>
</plist>
EOF

  # Create launcher script
  cat > "${CONTENTS}/MacOS/Electron" << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/../.."
exec code .
EOF

  chmod +x "${CONTENTS}/MacOS/Electron"

  # Create distributable archive
  cd "${BUILD_DIR}"
  tar -czf "${DIST_DIR}/vscode-ollama-${VERSION}-macos.tar.gz" macos/

  log_success "macOS binary created: vscode-ollama-${VERSION}-macos.tar.gz"
}

##############################################################################
# Build Linux Binary
##############################################################################

build_linux() {
  log_info "Building Linux binary..."

  local LINUX_BUILD="${BUILD_DIR}/linux"
  mkdir -p "${LINUX_BUILD}"

  # Create Linux app wrapper
  mkdir -p "${LINUX_BUILD}/vscode-ollama"
  cp -r "${PROJECT_ROOT}/out" "${LINUX_BUILD}/vscode-ollama/"

  # Create launcher script
  cat > "${LINUX_BUILD}/vscode-ollama/code" << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
exec code .
EOF

  chmod +x "${LINUX_BUILD}/vscode-ollama/code"

  # Create desktop entry
  cat > "${LINUX_BUILD}/vscode-ollama/vscode-ollama.desktop" << 'EOF'
[Desktop Entry]
Name=VS Code Ollama
Comment=AI-powered code completion using local Ollama models
Exec=vscode-ollama/code %U
Icon=vscode-ollama
Type=Application
Categories=Development;
EOF

  # Create tarball
  cd "${BUILD_DIR}"
  tar -czf "${DIST_DIR}/vscode-ollama-${VERSION}-linux.tar.gz" linux/

  log_success "Linux binary created: vscode-ollama-${VERSION}-linux.tar.gz"
}

##############################################################################
# Build Windows Binary
##############################################################################

build_windows() {
  log_info "Building Windows binary..."

  local WINDOWS_BUILD="${BUILD_DIR}/windows"
  mkdir -p "${WINDOWS_BUILD}"

  # Create Windows app wrapper
  mkdir -p "${WINDOWS_BUILD}/vscode-ollama"
  cp -r "${PROJECT_ROOT}/out" "${WINDOWS_BUILD}/vscode-ollama/"

  # Create batch launcher
  cat > "${WINDOWS_BUILD}/vscode-ollama/code.bat" << 'EOF'
@echo off
cd %~dp0
code .
EOF

  # Create PowerShell launcher
  cat > "${WINDOWS_BUILD}/vscode-ollama/code.ps1" << 'EOF'
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptPath
& code .
EOF

  # Create zip archive
  cd "${BUILD_DIR}"
  if command -v zip &> /dev/null; then
    zip -r "${DIST_DIR}/vscode-ollama-${VERSION}-windows.zip" windows/
  else
    log_warning "zip command not found, skipping Windows archive"
  fi

  log_success "Windows binary created: vscode-ollama-${VERSION}-windows.zip"
}

##############################################################################
# Create Release Package
##############################################################################

create_release_package() {
  log_info "Creating release package..."

  mkdir -p "${DIST_DIR}/vscode-ollama-${VERSION}"

  # Copy binaries
  cp -r "${BUILD_DIR}"/* "${DIST_DIR}/vscode-ollama-${VERSION}/"

  # Create README
  cat > "${DIST_DIR}/vscode-ollama-${VERSION}/README.md" << EOF
# VS Code Ollama ${VERSION}

AI-powered code completion using local Ollama models on GPU.

## Downloads

- **macOS**: \`vscode-ollama-${VERSION}-macos.tar.gz\`
  \`\`\`bash
  tar -xzf vscode-ollama-${VERSION}-macos.tar.gz
  ./macos/VS\ Code\ Ollama.app/Contents/MacOS/Electron
  \`\`\`

- **Linux**: \`vscode-ollama-${VERSION}-linux.tar.gz\`
  \`\`\`bash
  tar -xzf vscode-ollama-${VERSION}-linux.tar.gz
  ./linux/vscode-ollama/code
  \`\`\`

- **Windows**: \`vscode-ollama-${VERSION}-windows.zip\`
  \`\`\`cmd
  REM Extract zip, then:
  cd vscode-ollama
  code.bat
  \`\`\`

## Features

✨ AI Code Completion — Get intelligent suggestions as you type
🚀 GPU-Accelerated — Fast inference on dedicated GPU server
🔒 Fully Private — No external APIs, all computation stays local
⚙️ Customizable — Adjust models, temperature, context window

## Documentation

- Main README: https://github.com/alejandrodelarocha/vscode-ollama-fork
- Architecture: OLLAMA_INTEGRATION.md
- WordPress: docs/WORDPRESS_INTEGRATION.md
- Logo: LOGO_DESIGN.md

## Version

${VERSION} - Built $(date)

## License

MIT (same as VS Code)
EOF

  log_success "Release package created: vscode-ollama-${VERSION}/"
}

##############################################################################
# Generate Checksums
##############################################################################

generate_checksums() {
  log_info "Generating checksums..."

  cd "${DIST_DIR}"

  if command -v shasum &> /dev/null; then
    shasum -a 256 *.tar.gz *.zip > "vscode-ollama-${VERSION}-checksums.sha256" 2>/dev/null || true
    log_success "Checksums generated"
  else
    log_warning "shasum not found, skipping checksum generation"
  fi
}

##############################################################################
# Main Build Flow
##############################################################################

main() {
  # Create build directories
  mkdir -p "${BUILD_DIR}"
  mkdir -p "${DIST_DIR}"

  # Run pre-checks
  pre_build_checks

  # Compile TypeScript
  compile_typescript

  # Build requested platform(s)
  case "$PLATFORM" in
    macos)
      build_macos
      ;;
    linux)
      build_linux
      ;;
    windows)
      build_windows
      ;;
    all)
      build_macos
      build_linux
      build_windows
      ;;
    *)
      log_error "Unknown platform: $PLATFORM"
      echo "Usage: ./scripts/build.sh [macos|linux|windows|all]"
      exit 1
      ;;
  esac

  # Create release package
  create_release_package

  # Generate checksums
  generate_checksums

  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  Build Complete!                                           ║${NC}"
  echo -e "${GREEN}║  Output: ${DIST_DIR}${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
}

# Run main function
main
