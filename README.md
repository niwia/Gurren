# Gurren

**Gurren** is a [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin for Steam Deck that manages ASSella-tracked game updates directly from the Quick Access Menu.

The backend is powered by **Lagann** (`main.py`), a Python service that integrates with the ASSella game library system.

## Features

- 📋 **View all ASSella-managed games** in one place
- 🔍 **Check for updates** across your entire library
- ⬇️ **Download & install updates** with live progress tracking
- ❌ **Cancel in-progress updates** at any time

## Installation

1. Install [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) on your Steam Deck
2. Download the latest `Gurren.zip` from [Releases](https://github.com/niwia/Gurren/releases)
3. In Decky Loader's developer menu, choose **Install Plugin from ZIP** and select the file

## Development

```bash
# Install dependencies
pnpm install

# Build the frontend
pnpm build
```

## Architecture

| Component | Name   | Role                              |
|-----------|--------|-----------------------------------|
| Plugin    | Gurren | Decky Loader frontend (React/TSX) |
| Backend   | Lagann | Python backend / ASSella bridge   |

## License

MIT
