"""Lagann — Gurren Decky Loader Plugin backend.

Exposes backend integration methods for ASSella.
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


def _j(obj) -> str:
    """Ensure we always return a JSON string to the frontend."""
    if isinstance(obj, str):
        try:
            json.loads(obj)
            return obj
        except (json.JSONDecodeError, TypeError):
            pass
    return json.dumps(obj)


# Global tracking for background processes
ACTIVE_PROCESSES = {}


def get_steam_libraries():
    paths = []
    steam_path = "/home/deck/.local/share/Steam"
    if not os.path.isdir(steam_path):
        steam_path = os.path.expanduser("~/.steam/steam")
    
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
            logger.error(f"DeckTools: Error reading libraryfolders.vdf: {e}")
            
    if not paths:
        paths = [steam_path]
    return paths


def scan_assella_games():
    libraries = get_steam_libraries()
    games = []
    
    # Load update cache
    cache = {}
    cache_path = "/home/deck/.local/share/ACCELA/update_status_cache.json"
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            for appid, entry in raw.items():
                if isinstance(entry, dict) and "status" in entry:
                    cache[str(appid)] = entry["status"]
        except Exception as e:
            logger.error(f"DeckTools: Error loading update status cache: {e}")

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
                            # Check for markers
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
            logger.error(f"DeckTools: Error scanning library {lib}: {e}")
            continue
            
    games.sort(key=lambda x: x["name"].lower())
    return games


class Plugin:
    # ==========================================================================
    # Lifecycle
    # ==========================================================================

    async def _main(self):
        logger.info("DeckTools: Plugin loaded")

    async def _unload(self):
        logger.info("DeckTools: Plugin unloading")
        for key, proc in list(ACTIVE_PROCESSES.items()):
            try:
                proc.terminate()
            except Exception:
                pass
        ACTIVE_PROCESSES.clear()

    # ==========================================================================
    # ASSella Plugin API
    # ==========================================================================

    async def get_assella_games(self) -> str:
        """Scan and return installed ASSella games with update statuses."""
        try:
            games = scan_assella_games()
            return _j({"success": True, "games": games})
        except Exception as e:
            logger.error(f"DeckTools: Error in get_assella_games: {e}")
            return _j({"success": False, "error": str(e)})

    async def check_updates_all(self) -> str:
        """Trigger update check on all games in the background."""
        proc_key = "check_updates"
        if proc_key in ACTIVE_PROCESSES:
            poll = ACTIVE_PROCESSES[proc_key].poll()
            if poll is None:
                return _j({"success": True, "message": "Already checking updates."})
        
        log_path = "/tmp/assella_check_updates.log"
        if os.path.exists(log_path):
            try:
                os.remove(log_path)
            except Exception:
                pass
            
        cmd = [
            "sudo", "-u", "deck",
            "/home/deck/Projects/ASSella/asshead",
            "--check-updates"
        ]
        try:
            log_file = open(log_path, "w")
            proc = subprocess.Popen(cmd, stdout=log_file, stderr=subprocess.STDOUT, text=True)
            ACTIVE_PROCESSES[proc_key] = proc
            return _j({"success": True})
        except Exception as e:
            logger.error(f"DeckTools: Failed to start check_updates_all: {e}")
            return _j({"success": False, "error": str(e)})

    async def get_check_updates_status(self) -> str:
        """Return the status of the global update check."""
        proc_key = "check_updates"
        proc = ACTIVE_PROCESSES.get(proc_key)
        
        running = False
        if proc:
            poll = proc.poll()
            if poll is None:
                running = True
            else:
                del ACTIVE_PROCESSES[proc_key]
                
        log_path = "/tmp/assella_check_updates.log"
        progress = 0
        status_msg = "Checking for updates..."
        completed = False
        error = False
        
        if os.path.exists(log_path):
            try:
                with open(log_path, "r", encoding="utf-8") as f:
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

    async def update_game(self, appid: int) -> str:
        """Trigger update/download for a game in the background."""
        appid_str = str(appid)
        if appid_str in ACTIVE_PROCESSES:
            poll = ACTIVE_PROCESSES[appid_str].poll()
            if poll is None:
                return _j({"success": True, "message": "Already updating this game."})
                
        log_path = f"/tmp/assella_download_{appid_str}.log"
        if os.path.exists(log_path):
            try:
                os.remove(log_path)
            except Exception:
                pass
            
        cmd = [
            "sudo", "-u", "deck",
            "/home/deck/Projects/ASSella/asshead",
            "--appid", appid_str
        ]
        try:
            log_file = open(log_path, "w")
            proc = subprocess.Popen(cmd, stdout=log_file, stderr=subprocess.STDOUT, text=True)
            ACTIVE_PROCESSES[appid_str] = proc
            return _j({"success": True})
        except Exception as e:
            logger.error(f"DeckTools: Failed to start update for game {appid}: {e}")
            return _j({"success": False, "error": str(e)})

    async def get_update_game_status(self, appid: int) -> str:
        """Return the status of a specific game update."""
        appid_str = str(appid)
        proc = ACTIVE_PROCESSES.get(appid_str)
        
        running = False
        if proc:
            poll = proc.poll()
            if poll is None:
                running = True
            else:
                del ACTIVE_PROCESSES[appid_str]
                
        log_path = f"/tmp/assella_download_{appid_str}.log"
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
                            progress = int(m.group(1))
                            progress = int(progress * 0.9)  # scale down to leave room for post-processing
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
