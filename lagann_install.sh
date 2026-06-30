#!/usr/bin/env bash
# lagann_install.sh — Automatic installer for the Lagann backend
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/niwia/Gurren/main/lagann_install.sh | bash
#

set -euo pipefail

VERSION="v1.2.2"
RELEASE_URL="https://github.com/niwia/Gurren/releases/download/${VERSION}/Lagann-${VERSION}.zip"
TEMP_DIR=$(mktemp -d /tmp/lagann_install_XXXXXX)

# Cleanup on exit
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

echo "=================================================="
echo "          Lagann Remote Installer Loader          "
echo "=================================================="
echo "Preparing to install Lagann version: ${VERSION}"

# Download release bundle
echo "Downloading bundle from GitHub Releases..."
if ! curl -L -f -o "$TEMP_DIR/Lagann-${VERSION}.zip" "$RELEASE_URL"; then
    echo "Error: Failed to download release bundle from GitHub."
    echo "Please check your internet connection or repository status."
    exit 1
fi

# Extract release bundle
echo "Extracting setup bundle..."
if ! unzip -q "$TEMP_DIR/Lagann-${VERSION}.zip" -d "$TEMP_DIR"; then
    echo "Error: Failed to extract setup bundle zip."
    exit 1
fi

INSTALLER_DIR="$TEMP_DIR/Lagann-${VERSION}"
if [ -f "$INSTALLER_DIR/lagann_setup.sh" ]; then
    echo "Executing installer setup..."
    cd "$INSTALLER_DIR"
    bash lagann_setup.sh
else
    echo "Error: lagann_setup.sh was not found in the setup bundle directory."
    exit 1
fi
