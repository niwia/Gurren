import { callable } from "@decky/api";
import { GameInfo, CheckUpdatesStatus, UpdateGameStatus, LagannConfig } from "../types";
import { SteamUtils } from "./SteamUtils";

// API callables mapped to the python backend
const getAssellaGames       = callable<[], string>("get_assella_games");
const checkUpdatesAll       = callable<[], string>("check_updates_all");
const getCheckUpdatesStatus = callable<[], string>("get_check_updates_status");
const updateGame            = callable<[appid: number], string>("update_game");
const getUpdateGameStatus   = callable<[appid: number], string>("get_update_game_status");
const cancelUpdateGame      = callable<[appid: number], string>("cancel_update_game");
const getConfig             = callable<[], string>("get_config");
const saveConfig            = callable<[config_json: string], string>("save_config");

export class Backend {
  private static listeners: Set<() => void> = new Set();

  // Public reactive state
  public static games: GameInfo[] = [];
  public static loading: boolean = true;
  
  public static checkingUpdates: boolean = false;
  public static checkProgress: number = 0;
  public static checkStatusMsg: string = "";
  
  public static updatingAppId: string | null = null;
  public static updateProgress: number = 0;
  public static updateStatusMsg: string = "";
  
  public static downloadQueue: string[] = [];

  public static config: LagannConfig = {
    max_downloads: 32,
    save_old_manifests: true,
    max_old_manifests: 3,
    use_steamless: false,
    generate_achievements: false,
    auto_apply_goldberg: false
  };

  // Polling intervals
  private static checkInterval: NodeJS.Timeout | null = null;
  private static downloadInterval: NodeJS.Timeout | null = null;

  // React state synchronization hook helper
  static subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error("[Gurren] Error notifying state listener:", e);
      }
    });
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  static async init() {
    console.debug("[Gurren] Initializing Backend utility...");
    await this.loadConfig();
    await this.loadGames();
    await this.resumeState();
  }

  // ==========================================================================
  // Configuration Settings Management
  // ==========================================================================

  static async loadConfig() {
    try {
      console.debug("[Gurren] Loading ASSella configuration...");
      const res = await getConfig();
      this.config = JSON.parse(res);
      this.notify();
    } catch (e) {
      console.error("[Gurren] Failed to load config from backend:", e);
    }
  }

  static async updateConfig(updated: Partial<LagannConfig>) {
    this.config = { ...this.config, ...updated };
    this.notify();
    try {
      console.debug("[Gurren] Saving updated configuration:", updated);
      const res = await saveConfig(JSON.stringify(this.config));
      const parsed = JSON.parse(res);
      if (!parsed.success) {
        console.error("[Gurren] Failed to save config on backend:", parsed.error);
        SteamUtils.notify("Config Error", "Failed to save configuration.");
      }
    } catch (e) {
      console.error("[Gurren] Failed to update config:", e);
      SteamUtils.notify("Config Error", "Failed to update configuration.");
    }
  }

  static cleanup() {
    console.debug("[Gurren] Cleaning up Backend intervals...");
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.downloadInterval) {
      clearInterval(this.downloadInterval);
      this.downloadInterval = null;
    }
  }

  private static async resumeState() {
    try {
      // Resume updates check if running
      const checkRes = await getCheckUpdatesStatus();
      const checkParsed: CheckUpdatesStatus = JSON.parse(checkRes);
      if (checkParsed.running) {
        console.debug("[Gurren] Resuming update check polling...");
        this.checkingUpdates = true;
        this.checkProgress = checkParsed.progress;
        this.checkStatusMsg = checkParsed.status_msg;
        this.startCheckingPoll();
      }

      // Check if any game download is running
      for (const game of this.games) {
        const sRes = await getUpdateGameStatus(parseInt(game.appid));
        const sParsed: UpdateGameStatus = JSON.parse(sRes);
        if (sParsed.running) {
          console.debug(`[Gurren] Resuming download polling for AppID ${game.appid}...`);
          this.updatingAppId = game.appid;
          this.updateProgress = sParsed.progress;
          this.updateStatusMsg = sParsed.status_msg;
          this.startDownloadingPoll(game.appid);
          break;
        }
      }
      this.notify();
    } catch (e) {
      console.error("[Gurren] Error resuming backend state:", e);
    }
  }

  // ==========================================================================
  // Game Library Management
  // ==========================================================================

  static async loadGames() {
    this.loading = true;
    this.notify();
    try {
      console.debug("[Gurren] Fetching ASSella game list...");
      const res = await getAssellaGames();
      const parsed = JSON.parse(res);
      if (parsed.success) {
        this.games = parsed.games;
        console.debug(`[Gurren] Found ${this.games.length} ASSella games.`);
      } else {
        console.error("[Gurren] Backend failed to return games:", parsed.error);
      }
    } catch (e) {
      console.error("[Gurren] Failed loading games from backend:", e);
    } finally {
      this.loading = false;
      this.notify();
    }
  }

  // ==========================================================================
  // Update Check Management
  // ==========================================================================

  static async triggerUpdateCheck() {
    if (this.checkingUpdates) return;
    console.debug("[Gurren] Triggering global update check...");
    this.checkingUpdates = true;
    this.checkProgress = 0;
    this.checkStatusMsg = "Initializing update check...";
    this.notify();

    try {
      const res = await checkUpdatesAll();
      const parsed = JSON.parse(res);
      if (parsed.success) {
        this.startCheckingPoll();
      } else {
        this.checkStatusMsg = `Error: ${parsed.error}`;
        this.checkingUpdates = false;
        this.notify();
      }
    } catch (e) {
      console.error("[Gurren] Failed to start update check:", e);
      this.checkStatusMsg = "Failed to start update check.";
      this.checkingUpdates = false;
      this.notify();
    }
  }

  private static startCheckingPoll() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(async () => {
      try {
        const res = await getCheckUpdatesStatus();
        const parsed: CheckUpdatesStatus = JSON.parse(res);
        this.checkProgress = parsed.progress;
        this.checkStatusMsg = parsed.status_msg;

        if (parsed.completed || !parsed.running) {
          console.debug("[Gurren] Update check completed.");
          this.checkingUpdates = false;
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
          }
          await this.loadGames();
          
          // Toast notifies about updates if check finished successfully
          const updateCount = this.games.filter(g => g.update_status === "update_available").length;
          if (updateCount > 0) {
            SteamUtils.notify("ASSella Updates", `${updateCount} updates are available.`);
          } else {
            SteamUtils.notify("ASSella Updates", "All games are up to date.");
          }
        }
        this.notify();
      } catch (e) {
        console.error("[Gurren] Error during update check poll:", e);
      }
    }, 1000);
  }

  // ==========================================================================
  // Download Queue & Job Management
  // ==========================================================================

  static queueDownload(appid: string) {
    if (this.downloadQueue.includes(appid)) return;
    console.debug(`[Gurren] Queued download for AppID: ${appid}`);
    this.downloadQueue.push(appid);
    this.notify();

    if (this.updatingAppId === null) {
      this.startNextDownload();
    }
  }

  static dequeueDownload(appid: string) {
    if (this.updatingAppId === appid) {
      console.debug(`[Gurren] Canceling active download for AppID: ${appid}`);
      this.cancelDownload(appid);
    } else {
      console.debug(`[Gurren] Removing AppID ${appid} from download queue`);
      this.downloadQueue = this.downloadQueue.filter((id) => id !== appid);
      this.notify();
    }
  }

  static queueAllUpdates() {
    const updatableGames = this.games.filter(g => g.update_status === "update_available");
    console.debug(`[Gurren] Queuing updates for ${updatableGames.length} game(s)...`);
    for (const game of updatableGames) {
      if (!this.downloadQueue.includes(game.appid) && this.updatingAppId !== game.appid) {
        this.downloadQueue.push(game.appid);
      }
    }
    this.notify();

    if (this.updatingAppId === null) {
      this.startNextDownload();
    }
  }

  private static async startNextDownload() {
    if (this.downloadQueue.length === 0) {
      console.debug("[Gurren] Download queue empty.");
      return;
    }

    const nextAppId = this.downloadQueue.shift()!;
    const game = this.games.find(g => g.appid === nextAppId);
    const gameName = game ? game.name : nextAppId;

    console.debug(`[Gurren] Starting queued download for: ${gameName} (AppID: ${nextAppId})`);
    this.updatingAppId = nextAppId;
    this.updateProgress = 0;
    this.updateStatusMsg = "Initializing download...";
    this.notify();

    try {
      const res = await updateGame(parseInt(nextAppId));
      const parsed = JSON.parse(res);
      if (parsed.success) {
        this.startDownloadingPoll(nextAppId);
      } else {
        this.updateStatusMsg = `Error: ${parsed.error}`;
        SteamUtils.notify("ASSella Update Failed", `Failed to start update for ${gameName}: ${parsed.error}`);
        setTimeout(() => this.handleDownloadFinished(), 3000);
      }
    } catch (e) {
      console.error(`[Gurren] Failed to start update for game ${nextAppId}:`, e);
      this.updateStatusMsg = "Failed to start update.";
      SteamUtils.notify("ASSella Update Error", `Network or local failure updating ${gameName}.`);
      setTimeout(() => this.handleDownloadFinished(), 3000);
    }
  }

  private static startDownloadingPoll(appid: string) {
    if (this.downloadInterval) clearInterval(this.downloadInterval);
    const game = this.games.find(g => g.appid === appid);
    const gameName = game ? game.name : appid;

    this.downloadInterval = setInterval(async () => {
      try {
        const res = await getUpdateGameStatus(parseInt(appid));
        const parsed: UpdateGameStatus = JSON.parse(res);
        this.updateProgress = parsed.progress;
        this.updateStatusMsg = parsed.status_msg;

        if (parsed.completed || parsed.error || !parsed.running) {
          if (this.downloadInterval) {
            clearInterval(this.downloadInterval);
            this.downloadInterval = null;
          }

          if (parsed.completed) {
            console.debug(`[Gurren] Download completed successfully for AppID: ${appid}`);
            SteamUtils.notify("ASSella Update Success", `${gameName} updated successfully!`);
          } else if (parsed.error) {
            console.error(`[Gurren] Download failed for AppID: ${appid}: ${parsed.status_msg}`);
            SteamUtils.notify("ASSella Update Failed", `${gameName} update failed.`);
          }

          this.handleDownloadFinished();
        }
        this.notify();
      } catch (e) {
        console.error(`[Gurren] Error during download poll for appid ${appid}:`, e);
      }
    }, 1000);
  }

  private static async handleDownloadFinished() {
    this.updatingAppId = null;
    this.updateProgress = 0;
    this.updateStatusMsg = "";
    this.notify();
    await this.loadGames();
    this.startNextDownload();
  }

  private static async cancelDownload(appid: string) {
    const game = this.games.find(g => g.appid === appid);
    const gameName = game ? game.name : appid;
    console.debug(`[Gurren] Canceling download for AppID: ${appid}`);

    try {
      await cancelUpdateGame(parseInt(appid));
      if (this.downloadInterval) {
        clearInterval(this.downloadInterval);
        this.downloadInterval = null;
      }
      SteamUtils.notify("ASSella Update Canceled", `Canceled update check/download for ${gameName}`);
      this.handleDownloadFinished();
    } catch (e) {
      console.error(`[Gurren] Failed to cancel update for AppID ${appid}:`, e);
    }
  }
}
