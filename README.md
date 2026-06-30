# Gurren — ASSella Update Manager for Steam Deck

**Gurren** is a [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin for Steam Deck that manages ASSella-tracked game updates directly from the Quick Access Menu.

The backend is powered by **Lagann** — a headless Python service that bridges the Gurren plugin with the ASSella game library system.

---

## ⚡ Quick Start

### Step 1 — Install Decky Loader
Follow the instructions at [decky.xyz](https://decky.xyz) if you haven't already.

### Step 2 — Install Lagann (backend)
Open the Steam Deck Terminal (Konsole) and run the following single command to download and install Lagann:

```bash
curl -sSL https://raw.githubusercontent.com/niwia/Gurren/main/lagann_install.sh | bash
```

This will automatically:
- Download the latest Lagann release zip from GitHub.
- Extract and copy ASSella source files to `~/.local/share/Lagann/`
- Build a headless Python virtual environment.
- Create the executable `asshead` launcher.
- Safely clean up all temporary installation folders.

> **Note:** You need an active internet connection during setup so Python dependencies can be downloaded.

### Step 3 — Install Gurren plugin
In Decky Loader, go to **Settings → Developer → Install Plugin from ZIP** and select `Gurren-v1.2.1.zip` (or the latest version) from the release.

### Step 4 — Done!
Open the Quick Access Menu (•••), click the Gurren icon, and you'll see your ASSella-managed games.

---

## Features

| Feature | Status |
|---|---|
| 📋 View all ASSella-managed games | ✅ |
| 🔍 Check for updates across library | ✅ |
| ⬇️ Download & install game updates | ✅ |
| 📊 Live progress tracking | ✅ |
| ❌ Cancel in-progress downloads | ✅ |

---

## Architecture

| Component | Name   | Location | Role |
|-----------|--------|----------|------|
| Plugin    | Gurren | Decky Loader | React/TSX frontend |
| Backend   | Lagann | `~/.local/share/Lagann/` | Python / ASSella bridge |

---

## How it Works

Lagann reads ASSella's update cache at:
```
~/.local/share/ACCELA/update_status_cache.json
```

And calls ASSella in headless mode via:
```
~/.local/share/Lagann/asshead --check-updates
~/.local/share/Lagann/asshead --appid <appid>
```

ASSella game markers (`.ACCELA` / `.DepotDownloader`) in your Steam library determine which games Gurren shows.

---

## Development

```bash
# Install frontend dependencies
pnpm install

# Build the frontend
pnpm build
```

---

## License

MIT
