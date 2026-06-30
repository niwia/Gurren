#!/usr/bin/env bash
# lagann_setup.sh — Installs the Lagann backend for the Gurren Decky plugin
#
# Run this ONCE on your Steam Deck before using the Gurren plugin in Decky Loader.
# It copies the ASSella source files and builds a headless Python venv.
#
# Usage:
#   bash lagann_setup.sh
#
# Install target: ~/.local/share/Lagann/

set -euo pipefail

# ── Colors ─────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Paths ──────────────────────────────────────────────────────────────────────
LAGANN_DIR="$HOME/.local/share/Lagann"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_BUNDLE="$SCRIPT_DIR/lagann_src"          # src/ bundled next to this script
REQUIREMENTS="$SCRIPT_DIR/requirements_headless.txt"

# ── Helpers ────────────────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

print_banner() {
    echo -e ""
    echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║     Lagann Setup — Gurren Plugin v1.2.2  ║${NC}"
    echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════╝${NC}"
    echo -e ""
}

# ── Pre-flight checks ──────────────────────────────────────────────────────────
check_prereqs() {
    info "Checking prerequisites..."

    if [ ! -d "$SRC_BUNDLE" ]; then
        error "lagann_src/ not found next to this script (expected: $SRC_BUNDLE)"
    fi

    if [ ! -f "$REQUIREMENTS" ]; then
        error "requirements_headless.txt not found (expected: $REQUIREMENTS)"
    fi

    if ! command -v python3 &>/dev/null; then
        error "python3 is not available. Please install Python 3.10+ and try again."
    fi

    PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    info "Found Python $PYTHON_VERSION"

    if ! command -v pip3 &>/dev/null && ! python3 -m pip --version &>/dev/null 2>&1; then
        error "pip is not available. Please install pip and try again."
    fi

    success "Prerequisites OK"
}

# ── Create directory structure ─────────────────────────────────────────────────
create_dirs() {
    info "Creating Lagann directory at $LAGANN_DIR ..."
    mkdir -p "$LAGANN_DIR"
    success "Directory ready: $LAGANN_DIR"
}

# ── Copy ASSella source ────────────────────────────────────────────────────────
copy_source() {
    info "Copying ASSella source files..."
    # Remove old src if present so we get a clean copy
    rm -rf "$LAGANN_DIR/src"
    cp -r "$SRC_BUNDLE" "$LAGANN_DIR/src"
    success "Source copied to $LAGANN_DIR/src"
}

# ── Write asshead launcher ─────────────────────────────────────────────────────
write_asshead() {
    info "Writing asshead launcher..."
    cat > "$LAGANN_DIR/asshead" << 'EOF'
#!/usr/bin/env bash
# asshead — Lagann headless ASSella launcher
LAGANN_DIR="$HOME/.local/share/Lagann"
PYTHON_EXEC="$LAGANN_DIR/venv/bin/python3"
SRC_MAIN="$LAGANN_DIR/src/main.py"

if [ ! -f "$PYTHON_EXEC" ]; then
    echo "Error: Lagann venv not found. Run lagann_setup.sh."
    exit 1
fi

if [ ! -f "$SRC_MAIN" ]; then
    echo "Error: ASSella source not found. Run lagann_setup.sh."
    exit 1
fi

export PYTHONPATH="$LAGANN_DIR/src"
QT_QPA_PLATFORM=offscreen exec "$PYTHON_EXEC" "$SRC_MAIN" --helper "$@"
EOF
    chmod +x "$LAGANN_DIR/asshead"
    success "asshead written and made executable"
}

# ── Build Python venv ──────────────────────────────────────────────────────────
build_venv() {
    info "Creating Python virtual environment (headless — no PyQt6)..."
    info "This may take a few minutes on first run..."

    # Wipe any stale venv
    rm -rf "$LAGANN_DIR/venv"

    python3 -m venv "$LAGANN_DIR/venv"
    success "venv created"

    info "Installing Python dependencies..."
    "$LAGANN_DIR/venv/bin/pip" install --upgrade pip --quiet
    "$LAGANN_DIR/venv/bin/pip" install -r "$REQUIREMENTS" --quiet
    success "Dependencies installed"
}

# ── Verify install ─────────────────────────────────────────────────────────────
verify() {
    info "Verifying installation..."

    local ok=true

    for f in "$LAGANN_DIR/asshead" "$LAGANN_DIR/venv/bin/python3" "$LAGANN_DIR/src/main.py"; do
        if [ -f "$f" ]; then
            success "Found: $f"
        else
            warn "Missing: $f"
            ok=false
        fi
    done

    if [ "$ok" = true ]; then
        echo -e ""
        echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}${BOLD}║  ✓ Lagann v1.2.2 installed successfully!  ║${NC}"
        echo -e "${GREEN}${BOLD}║                                          ║${NC}"
        echo -e "${GREEN}${BOLD}║  You can now use the Gurren plugin       ║${NC}"
        echo -e "${GREEN}${BOLD}║  in Decky Loader.                        ║${NC}"
        echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}"
        echo -e ""
    else
        warn "Installation may be incomplete. Check the output above for missing files."
    fi
}

# ── Main ───────────────────────────────────────────────────────────────────────
print_banner
check_prereqs
create_dirs
copy_source
write_asshead
build_venv
verify
