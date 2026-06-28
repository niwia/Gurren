#!/usr/bin/env bash
# install.sh — Gurren one-shot installer
# Usage: curl -fsSL https://raw.githubusercontent.com/niwia/Gurren/main/install.sh | bash
#
# What this does:
#   1. Fetches the latest Gurren release from GitHub
#   2. Downloads & extracts the release bundle
#   3. Runs lagann_setup.sh to install the Lagann backend
#   4. Tells you where to find Gurren.zip for Decky Loader
#   5. Cleans up temporary files

set -euo pipefail

# ── Config ─────────────────────────────────────────────────────────────────────
GITHUB_REPO="niwia/Gurren"
INSTALL_DIR="$HOME/.local/share/Lagann"
TMP_DIR="$(mktemp -d /tmp/gurren_install_XXXXXX)"

# ── Colors ─────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; rm -rf "$TMP_DIR"; exit 1; }

# ── Banner ─────────────────────────────────────────────────────────────────────
echo -e ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║   Gurren Installer — ASSella Manager for Decky   ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo -e ""

# ── Pre-flight ─────────────────────────────────────────────────────────────────
for cmd in curl python3 unzip; do
    if ! command -v "$cmd" &>/dev/null; then
        error "Required tool not found: $cmd"
    fi
done
success "Prerequisites OK (curl, python3, unzip)"

# ── Fetch latest release ───────────────────────────────────────────────────────
info "Fetching latest Gurren release info from GitHub..."
API_URL="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
RELEASE_JSON=$(curl -fsSL "$API_URL") || error "Failed to fetch release info from GitHub."

# Extract version tag
VERSION=$(echo "$RELEASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['tag_name'])")
info "Latest release: ${BOLD}${VERSION}${NC}"

# Find the release bundle URL (the big zip, not the Gurren plugin zip)
BUNDLE_URL=$(echo "$RELEASE_JSON" | python3 -c "
import sys, json
assets = json.load(sys.stdin)['assets']
# Prefer the release bundle zip (not the plugin zip)
for a in assets:
    if 'release' in a['name'].lower() or 'bundle' in a['name'].lower():
        print(a['browser_download_url'])
        sys.exit(0)
# Fallback: first zip that isn't just 'Gurren.zip'
for a in assets:
    if a['name'].endswith('.zip') and a['name'] != 'Gurren.zip':
        print(a['browser_download_url'])
        sys.exit(0)
# Last resort: any zip
for a in assets:
    if a['name'].endswith('.zip'):
        print(a['browser_download_url'])
        sys.exit(0)
print('')
") || true

# If no release asset found, fall back to source tarball
if [ -z "$BUNDLE_URL" ]; then
    warn "No release bundle found — falling back to GitHub source archive."
    BUNDLE_URL="https://github.com/${GITHUB_REPO}/archive/refs/tags/${VERSION}.tar.gz"
    BUNDLE_TYPE="tar"
else
    BUNDLE_TYPE="zip"
fi

# ── Download ───────────────────────────────────────────────────────────────────
BUNDLE_FILE="$TMP_DIR/gurren_bundle.${BUNDLE_TYPE}"
info "Downloading release bundle..."
curl -fsSL --progress-bar -o "$BUNDLE_FILE" "$BUNDLE_URL" \
    || error "Download failed. Check your internet connection."
success "Downloaded: $(du -sh "$BUNDLE_FILE" | cut -f1)"

# ── Extract ────────────────────────────────────────────────────────────────────
info "Extracting..."
EXTRACT_DIR="$TMP_DIR/extracted"
mkdir -p "$EXTRACT_DIR"

if [ "$BUNDLE_TYPE" = "zip" ]; then
    unzip -q "$BUNDLE_FILE" -d "$EXTRACT_DIR"
else
    tar -xzf "$BUNDLE_FILE" -C "$EXTRACT_DIR" --strip-components=1
fi

# Find the directory that contains lagann_setup.sh
SETUP_DIR=$(find "$EXTRACT_DIR" -name "lagann_setup.sh" -maxdepth 3 | head -1 | xargs dirname 2>/dev/null || true)
if [ -z "$SETUP_DIR" ]; then
    error "lagann_setup.sh not found in the release bundle. Unexpected bundle structure."
fi
success "Extracted to: $SETUP_DIR"

# ── Run lagann_setup.sh ────────────────────────────────────────────────────────
echo -e ""
info "Running Lagann backend setup..."
echo -e ""
bash "$SETUP_DIR/lagann_setup.sh"

# ── Copy Gurren.zip to home ────────────────────────────────────────────────────
GURREN_ZIP=$(find "$SETUP_DIR" -name "Gurren.zip" | head -1 || true)
if [ -n "$GURREN_ZIP" ]; then
    cp "$GURREN_ZIP" "$HOME/Gurren.zip"
    echo -e ""
    success "Gurren.zip saved to: ${BOLD}$HOME/Gurren.zip${NC}"
fi

# ── Cleanup ────────────────────────────────────────────────────────────────────
rm -rf "$TMP_DIR"

# ── Final instructions ─────────────────────────────────────────────────────────
echo -e ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  ✓ Lagann backend installed!                     ║${NC}"
echo -e "${GREEN}${BOLD}║                                                  ║${NC}"
echo -e "${GREEN}${BOLD}║  Now install the Decky plugin:                   ║${NC}"
echo -e "${GREEN}${BOLD}║                                                  ║${NC}"
echo -e "${GREEN}${BOLD}║  1. Open Decky Loader                            ║${NC}"
echo -e "${GREEN}${BOLD}║  2. Settings → Developer                         ║${NC}"
echo -e "${GREEN}${BOLD}║  3. Install Plugin from ZIP                      ║${NC}"
echo -e "${GREEN}${BOLD}║  4. Select: ~/Gurren.zip                         ║${NC}"
echo -e "${GREEN}${BOLD}║                                                  ║${NC}"
echo -e "${GREEN}${BOLD}║  Lagann installed to:                            ║${NC}"
echo -e "${GREEN}${BOLD}║    ~/.local/share/Lagann/                        ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo -e ""
