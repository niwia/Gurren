#!/usr/bin/env bash
# install.sh — Lagann backend installer for Gurren
# Usage: curl -fsSL https://raw.githubusercontent.com/niwia/Gurren/main/install.sh | bash
#
# What this does:
#   1. Fetches the latest Gurren release from GitHub
#   2. Downloads & extracts the Lagann backend bundle
#   3. Installs everything to ~/.local/share/Lagann/
#
# After this, download Gurren.zip from the GitHub release page and
# install it via Decky Loader → Settings → Developer → Install Plugin from ZIP

set -euo pipefail

# ── Config ─────────────────────────────────────────────────────────────────────
GITHUB_REPO="niwia/Gurren"
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
echo -e "${CYAN}${BOLD}║      Lagann Installer — backend for Gurren       ║${NC}"
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
info "Fetching latest release info from GitHub..."
API_URL="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
RELEASE_JSON=$(curl -fsSL "$API_URL") || error "Failed to fetch release info. Check your internet connection."

VERSION=$(echo "$RELEASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['tag_name'])")
info "Latest release: ${BOLD}${VERSION}${NC}"

# Find the Lagann bundle zip (not the Gurren plugin zip)
BUNDLE_URL=$(echo "$RELEASE_JSON" | python3 -c "
import sys, json
assets = json.load(sys.stdin)['assets']
# Prefer a zip with 'lagann' in the name
for a in assets:
    name = a['name'].lower()
    if 'lagann' in name and name.endswith('.zip'):
        print(a['browser_download_url'])
        sys.exit(0)
# Fallback: any zip that is not the bare Gurren plugin
for a in assets:
    name = a['name'].lower()
    if name.endswith('.zip') and name != 'gurren.zip':
        print(a['browser_download_url'])
        sys.exit(0)
print('')
") || true

if [ -z "$BUNDLE_URL" ]; then
    error "Could not find the Lagann bundle in the release assets.
  Visit: https://github.com/${GITHUB_REPO}/releases/latest"
fi

# ── Download ───────────────────────────────────────────────────────────────────
BUNDLE_FILE="$TMP_DIR/lagann_bundle.zip"
info "Downloading Lagann bundle..."
curl -fsSL --progress-bar -o "$BUNDLE_FILE" "$BUNDLE_URL" \
    || error "Download failed. Check your internet connection."
success "Downloaded: $(du -sh "$BUNDLE_FILE" | cut -f1)"

# ── Extract ────────────────────────────────────────────────────────────────────
info "Extracting..."
EXTRACT_DIR="$TMP_DIR/extracted"
mkdir -p "$EXTRACT_DIR"
unzip -q "$BUNDLE_FILE" -d "$EXTRACT_DIR"

# Find lagann_setup.sh anywhere inside the extracted bundle
SETUP_SCRIPT=$(find "$EXTRACT_DIR" -name "lagann_setup.sh" -maxdepth 4 | head -1 || true)
if [ -z "$SETUP_SCRIPT" ]; then
    error "lagann_setup.sh not found inside the bundle. Unexpected structure."
fi
success "Bundle extracted"

# ── Run lagann_setup.sh ────────────────────────────────────────────────────────
echo -e ""
info "Running Lagann setup..."
echo -e ""
bash "$SETUP_SCRIPT"

# ── Cleanup ────────────────────────────────────────────────────────────────────
rm -rf "$TMP_DIR"

# ── Done ───────────────────────────────────────────────────────────────────────
echo -e ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  ✓ Lagann installed!                             ║${NC}"
echo -e "${GREEN}${BOLD}║                                                  ║${NC}"
echo -e "${GREEN}${BOLD}║  Next: install the Gurren Decky plugin           ║${NC}"
echo -e "${GREEN}${BOLD}║                                                  ║${NC}"
echo -e "${GREEN}${BOLD}║  1. Download Gurren.zip from:                    ║${NC}"
echo -e "${GREEN}${BOLD}║     github.com/niwia/Gurren/releases/latest      ║${NC}"
echo -e "${GREEN}${BOLD}║                                                  ║${NC}"
echo -e "${GREEN}${BOLD}║  2. In Decky Loader:                             ║${NC}"
echo -e "${GREEN}${BOLD}║     Settings → Developer →                       ║${NC}"
echo -e "${GREEN}${BOLD}║     Install Plugin from ZIP                      ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo -e ""
