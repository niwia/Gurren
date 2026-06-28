"""Lagann — Gurren Decky Loader Plugin backend.

Exposes backend integration methods for ASSella.
All runtime files live under: /home/deck/.local/share/Lagann/
"""

import os
import re
import json
import subprocess

try:
    import decky  # type: ignore
    logger = decky.logger
except ImportError:
    import logging
    logger = logging.getLogger("lagann")


# ─── Lagann install directory ─────────────────────────────────────────────────
# Decky Loader runs as root, so os.path.expanduser("~") resolves to /root.
# We must use explicit /home/deck to locate the deck user's directories.
DECK_HOME    = "/home/deck"
LAGANN_DIR   = os.path.join(DECK_HOME, ".local/share/Lagann")
ASSHEAD      = os.path.join(LAGANN_DIR, "asshead")
PYTHON_EXEC  = os.path.join(LAGANN_DIR, "venv", "bin", "python3")
SRC_MAIN     = os.path.join(LAGANN_DIR, "src", "main.py")

# ASSella writes its update cache here (must match ASSella's own path)
ACCELA_CACHE = os.path.join(DECK_HOME, ".local/share/ACCELA/update_status_cache.json")

# Temp log files for background processes
LOG_CHECK_UPDATES = "/tmp/lagann_check_updates.log"
LOG_DOWNLOAD_FMT  = "/tmp/lagann_download_{appid}.log"
# ──────────────────────────────────────────────────────────────────────────────


# Config files
CONFIG_JSON = os.path.join(LAGANN_DIR, "config.json")
ACCELA_CONF = os.path.join(DECK_HOME, ".config/Tachibana Labs/ACCELA.conf")

def sync_config():
    """Load config.json and sync settings to ACCELA.conf."""
    default_config = {
        "max_downloads": 32,
        "save_old_manifests": True,
        "max_old_manifests": 3
    }
    
    # Load config.json
    config = default_config.copy()
    if os.path.isfile(CONFIG_JSON):
        try:
            with open(CONFIG_JSON, "r", encoding="utf-8") as f:
                user_conf = json.load(f)
            if isinstance(user_conf, dict):
                config.update(user_conf)
        except Exception as e:
            logger.error(f"Lagann: Error loading config.json: {e}")
            
    # Save back/format config.json
    try:
        os.makedirs(LAGANN_DIR, exist_ok=True)
        with open(CONFIG_JSON, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        logger.error(f"Lagann: Error writing config.json: {e}")

    # Synchronize to ACCELA.conf
    conf_dir = os.path.dirname(ACCELA_CONF)
    try:
        os.makedirs(conf_dir, exist_ok=True)
        
        # Read existing file if it exists
        content = ""
        if os.path.isfile(ACCELA_CONF):
            with open(ACCELA_CONF, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                
        # Parse and update key-value pairs
        lines = content.splitlines()
        updated_keys = set()
        new_lines = []
        for line in lines:
            line_strip = line.strip()
            if "=" in line_strip and not line_strip.startswith("#"):
                key, val = line_strip.split("=", 1)
                key = key.strip()
                if key in config:
                    new_lines.append(f"{key}={config[key]}")
                    updated_keys.add(key)
                    continue
            new_lines.append(line)
            
        # Add missing keys
        for key, val in config.items():
            if key not in updated_keys:
                new_lines.append(f"{key}={val}")
                
        with open(ACCELA_CONF, "w", encoding="utf-8") as f:
            f.write("\n".join(new_lines) + "\n")
            
    except Exception as e:
        logger.error(f"Lagann: Error syncing to ACCELA.conf: {e}")


def _j(obj) -> str:
    """Ensure we always return a JSON string to the frontend."""
    if isinstance(obj, str):
        try:
            json.loads(obj)
            return obj
        except (json.JSONDecodeError, TypeError):
            pass
    return json.dumps(obj)


def _lagann_ready() -> bool:
    """Check that the Lagann runtime is installed and functional."""
    return (
        os.path.isdir(LAGANN_DIR)
        and os.path.isfile(ASSHEAD)
        and os.path.isfile(PYTHON_EXEC)
        and os.path.isfile(SRC_MAIN)
    )


# Global tracking for background processes
ACTIVE_PROCESSES = {}


def get_steam_libraries():
    paths = []
    steam_path = os.path.join(DECK_HOME, ".local/share/Steam")
    if not os.path.isdir(steam_path):
        steam_path = os.path.join(DECK_HOME, ".steam/steam")

    library_vdf = os.path.join(steam_path, "steamapps", "libraryfolders.vdf")
    if not os.path.exists(library_vdf):
        library_vdf = os.path.join(steam_path, "config", "libraryfolders.vdf")

    if os.path.exists(library_vdf):
        try:
            with open(library_vdf, "r", encoding="utf-8") as f:
                content = f.read()
            matches = re.findall(r'"path"\s*"([^"]+)"', content)
            for m in matches:
                p = m.replace("\\\\", "/")
                if os.path.isdir(p):
                    paths.append(p)
        except Exception as e:
            logger.error(f"Lagann: Error reading libraryfolders.vdf: {e}")

    if not paths:
        paths = [steam_path]
    return paths


def scan_assella_games():
    libraries = get_steam_libraries()
    games = []

    # Load update cache written by ASSella
    cache = {}
    if os.path.exists(ACCELA_CACHE):
        try:
            with open(ACCELA_CACHE, "r", encoding="utf-8") as f:
                raw = json.load(f)
            for appid, entry in raw.items():
                if isinstance(entry, dict) and "status" in entry:
                    cache[str(appid)] = entry["status"]
        except Exception as e:
            logger.error(f"Lagann: Error loading update status cache: {e}")

    for lib in libraries:
        steamapps = os.path.join(lib, "steamapps")
        common = os.path.join(steamapps, "common")
        if not os.path.isdir(common):
            continue

        try:
            acf_files = [f for f in os.listdir(steamapps) if f.startswith("appmanifest_") and f.endswith(".acf")]
            for acf in acf_files:
                acf_path = os.path.join(steamapps, acf)
                appid_match = re.search(r"appmanifest_(\d+)\.acf", acf)
                if not appid_match:
                    continue
                appid = appid_match.group(1)

                try:
                    with open(acf_path, "r", encoding="utf-8", errors="ignore") as f:
                        acf_content = f.read()

                    name_match = re.search(r'"name"\s*"([^"]+)"', acf_content)
                    installdir_match = re.search(r'"installdir"\s*"([^"]+)"', acf_content)

                    if name_match and installdir_match:
                        game_name = name_match.group(1)
                        installdir = installdir_match.group(1)
                        game_path = os.path.join(common, installdir)

                        if os.path.isdir(game_path):
                            has_marker = False
                            for marker in (".ACCELA", ".DepotDownloader"):
                                if os.path.exists(os.path.join(game_path, marker)):
                                    has_marker = True
                                    break

                            if has_marker:
                                status = cache.get(appid, "up_to_date")
                                games.append({
                                    "appid": appid,
                                    "name": game_name,
                                    "install_path": game_path,
                                    "update_status": status
                                })
                except Exception:
                    continue
        except Exception as e:
            logger.error(f"Lagann: Error scanning library {lib}: {e}")
            continue

    games.sort(key=lambda x: x["name"].lower())
    return games


class Plugin:
    # ==========================================================================
    # Lifecycle
    # ==========================================================================

    async def _main(self):
        logger.info("Lagann: Plugin loaded")
        sync_config()
        if not _lagann_ready():
            logger.warning(
                f"Lagann: runtime not found at {LAGANN_DIR}. "
                "Please run lagann_setup.sh to install."
            )

    async def _unload(self):
        logger.info("Lagann: Plugin unloading")
        for key, proc in list(ACTIVE_PROCESSES.items()):
            try:
                proc.terminate()
            except Exception:
                pass
        ACTIVE_PROCESSES.clear()

    # ==========================================================================
    # Lagann Health
    # ==========================================================================

    async def check_lagann_ready(self) -> str:
        """Return whether the Lagann runtime is installed and ready."""
        ready = _lagann_ready()
        return _j({
            "ready": ready,
            "lagann_dir": LAGANN_DIR,
            "missing": [] if ready else [
                p for p in [ASSHEAD, PYTHON_EXEC, SRC_MAIN]
                if not os.path.isfile(p)
            ]
        })

    # ==========================================================================
    # ASSella Plugin API
    # ==========================================================================

    async def get_assella_games(self) -> str:
        """Scan and return installed ASSella games with update statuses."""
        if not _lagann_ready():
            return _j({"success": False, "error": "Lagann runtime not installed. Run lagann_setup.sh first."})
        try:
            games = scan_assella_games()
            return _j({"success": True, "games": games})
        except Exception as e:
            logger.error(f"Lagann: Error in get_assella_games: {e}")
            return _j({"success": False, "error": str(e)})

    async def check_updates_all(self) -> str:
        """Trigger update check on all games in the background."""
        if not _lagann_ready():
            return _j({"success": False, "error": "Lagann runtime not installed. Run lagann_setup.sh first."})

        proc_key = "check_updates"
        if proc_key in ACTIVE_PROCESSES:
            if ACTIVE_PROCESSES[proc_key].poll() is None:
                return _j({"success": True, "message": "Already checking updates."})

        if os.path.exists(LOG_CHECK_UPDATES):
            try:
                os.remove(LOG_CHECK_UPDATES)
            except Exception:
                pass

        sync_config()
        cmd = ["sudo", "-u", "deck", ASSHEAD, "--check-updates"]
        try:
            log_file = open(LOG_CHECK_UPDATES, "w")
            proc = subprocess.Popen(cmd, stdout=log_file, stderr=subprocess.STDOUT, text=True)
            ACTIVE_PROCESSES[proc_key] = proc
            return _j({"success": True})
        except Exception as e:
            logger.error(f"Lagann: Failed to start check_updates_all: {e}")
            return _j({"success": False, "error": str(e)})

    async def get_check_updates_status(self) -> str:
        """Return the status of the global update check."""
        proc_key = "check_updates"
        proc = ACTIVE_PROCESSES.get(proc_key)

        running = False
        if proc:
            if proc.poll() is None:
                running = True
            else:
                del ACTIVE_PROCESSES[proc_key]

        progress = 0
        status_msg = "Checking for updates..."
        completed = False
        error = False

        if os.path.exists(LOG_CHECK_UPDATES):
            try:
                with open(LOG_CHECK_UPDATES, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                for line in reversed(lines):
                    if "Update check progress:" in line:
                        m = re.search(r"Update check progress:\s*(\d+)/(\d+)", line)
                        if m:
                            current = int(m.group(1))
                            total = int(m.group(2))
                            if total > 0:
                                progress = int((current / total) * 100)
                            status_msg = f"Checking updates: {current}/{total} games..."
                            break
                    elif "completed successfully" in line:
                        progress = 100
                        status_msg = "Update check completed successfully."
                        completed = True
                        break
                    elif "Failed to" in line or "Error:" in line or "failed with error" in line:
                        status_msg = f"Failed: {line.strip()}"
                        error = True
                        break
            except Exception as e:
                status_msg = f"Reading log failed: {e}"
        else:
            status_msg = "Not started"

        if not running and not completed and not error:
            if os.path.exists(LOG_CHECK_UPDATES):
                completed = True
                progress = 100
                status_msg = "Completed."
            else:
                status_msg = "Idle"

        return _j({
            "running": running,
            "progress": progress,
            "status_msg": status_msg,
            "completed": completed,
            "error": error
        })

    async def update_game(self, appid: int) -> str:
        """Trigger update/download for a game in the background."""
        if not _lagann_ready():
            return _j({"success": False, "error": "Lagann runtime not installed. Run lagann_setup.sh first."})

        appid_str = str(appid)
        if appid_str in ACTIVE_PROCESSES:
            if ACTIVE_PROCESSES[appid_str].poll() is None:
                return _j({"success": True, "message": "Already updating this game."})

        log_path = LOG_DOWNLOAD_FMT.format(appid=appid_str)
        if os.path.exists(log_path):
            try:
                os.remove(log_path)
            except Exception:
                pass

        sync_config()
        cmd = ["sudo", "-u", "deck", ASSHEAD, "--appid", appid_str]
        try:
            log_file = open(log_path, "w")
            proc = subprocess.Popen(cmd, stdout=log_file, stderr=subprocess.STDOUT, text=True)
            ACTIVE_PROCESSES[appid_str] = proc
            return _j({"success": True})
        except Exception as e:
            logger.error(f"Lagann: Failed to start update for game {appid}: {e}")
            return _j({"success": False, "error": str(e)})

    async def get_update_game_status(self, appid: int) -> str:
        """Return the status of a specific game update."""
        appid_str = str(appid)
        proc = ACTIVE_PROCESSES.get(appid_str)

        running = False
        if proc:
            if proc.poll() is None:
                running = True
            else:
                del ACTIVE_PROCESSES[appid_str]

        log_path = LOG_DOWNLOAD_FMT.format(appid=appid_str)
        progress = 0
        status_msg = "Starting update..."
        completed = False
        error = False

        if os.path.exists(log_path):
            try:
                with open(log_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                for line in reversed(lines):
                    if "Download progress:" in line:
                        m = re.search(r"Download progress:\s*(\d+)%", line)
                        if m:
                            progress = int(int(m.group(1)) * 0.9)
                            status_msg = f"Downloading: {m.group(1)}%"
                            break
                    elif "Running post-processing pipeline" in line:
                        progress = 92
                        status_msg = "Post-processing (Goldberg, ACF, DRM removal)..."
                        break
                    elif "completed successfully" in line:
                        progress = 100
                        status_msg = "Update completed successfully!"
                        completed = True
                        break
                    elif "Failed to" in line or "Error:" in line or "failed with error" in line:
                        status_msg = f"Failed: {line.strip()}"
                        error = True
                        break
            except Exception as e:
                status_msg = f"Reading log failed: {e}"
        else:
            status_msg = "Not started"

        if not running and not completed and not error:
            if os.path.exists(log_path):
                completed = True
                progress = 100
                status_msg = "Completed."
            else:
                status_msg = "Idle"

        return _j({
            "running": running,
            "progress": progress,
            "status_msg": status_msg,
            "completed": completed,
            "error": error
        })

    async def cancel_update_game(self, appid: int) -> str:
        """Cancel the download/update process for a game."""
        appid_str = str(appid)
        proc = ACTIVE_PROCESSES.get(appid_str)
        if proc:
            try:
                proc.terminate()
                proc.wait(timeout=3)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass
            if appid_str in ACTIVE_PROCESSES:
                del ACTIVE_PROCESSES[appid_str]
            return _j({"success": True})
        return _j({"success": False, "error": "No active process found for this game."})
