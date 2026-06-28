import {
  definePlugin,
  callable
} from "@decky/api";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  ProgressBar,
  staticClasses
} from "@decky/ui";
import React, { useState, useEffect } from "react";

// ── Python callables ──────────────────────────────────────────────────────────
const getAssellaGames       = callable<[], string>("get_assella_games");
const checkUpdatesAll       = callable<[], string>("check_updates_all");
const getCheckUpdatesStatus = callable<[], string>("get_check_updates_status");
const updateGame            = callable<[appid: number], string>("update_game");
const getUpdateGameStatus   = callable<[appid: number], string>("get_update_game_status");
const cancelUpdateGame      = callable<[appid: number], string>("cancel_update_game");

const GurrenApp: React.FC = () => {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Update check state
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [checkProgress, setCheckProgress]     = useState(0);
  const [checkStatusMsg, setCheckStatusMsg]   = useState("");

  // Active download state
  const [updatingAppId, setUpdatingAppId]   = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatusMsg, setUpdateStatusMsg] = useState("");

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadGames = async () => {
    setLoading(true);
    try {
      const res    = await getAssellaGames();
      const parsed = JSON.parse(res);
      if (parsed.success) setGames(parsed.games);
    } catch (e) {
      console.error("Gurren: failed to load games", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleCheckUpdates = async () => {
    if (checkingUpdates) return;
    setCheckingUpdates(true);
    setCheckProgress(0);
    setCheckStatusMsg("Initializing update check...");
    try {
      const res    = await checkUpdatesAll();
      const parsed = JSON.parse(res);
      if (!parsed.success) {
        setCheckStatusMsg(`Error: ${parsed.error}`);
        setCheckingUpdates(false);
      }
    } catch (e) {
      setCheckStatusMsg("Failed to check updates.");
      setCheckingUpdates(false);
    }
  };

  const handleUpdateGame = async (appid: string) => {
    if (updatingAppId) return;
    setUpdatingAppId(appid);
    setUpdateProgress(0);
    setUpdateStatusMsg("Starting download...");
    try {
      const res    = await updateGame(parseInt(appid));
      const parsed = JSON.parse(res);
      if (!parsed.success) {
        setUpdateStatusMsg(`Error: ${parsed.error}`);
        setTimeout(() => setUpdatingAppId(null), 3000);
      }
    } catch (e) {
      setUpdateStatusMsg("Failed to start update.");
      setTimeout(() => setUpdatingAppId(null), 3000);
    }
  };

  const handleCancelUpdate = async (appid: string) => {
    try {
      await cancelUpdateGame(parseInt(appid));
      setUpdatingAppId(null);
      loadGames();
    } catch (e) {
      console.error("Gurren: failed to cancel update", e);
    }
  };

  // ── Polling: update check progress ─────────────────────────────────────────
  useEffect(() => {
    if (!checkingUpdates) return;
    const interval = setInterval(async () => {
      try {
        const res    = await getCheckUpdatesStatus();
        const parsed = JSON.parse(res);
        setCheckProgress(parsed.progress);
        setCheckStatusMsg(parsed.status_msg);
        if (parsed.completed || !parsed.running) {
          setCheckingUpdates(false);
          clearInterval(interval);
          loadGames();
        }
      } catch (e) {
        console.error("Gurren: status poll error", e);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [checkingUpdates]);

  // ── Polling: download progress ──────────────────────────────────────────────
  useEffect(() => {
    if (!updatingAppId) return;
    const interval = setInterval(async () => {
      try {
        const res    = await getUpdateGameStatus(parseInt(updatingAppId));
        const parsed = JSON.parse(res);
        setUpdateProgress(parsed.progress);
        setUpdateStatusMsg(parsed.status_msg);
        if (parsed.completed || parsed.error || !parsed.running) {
          clearInterval(interval);
          if (parsed.completed) {
            setTimeout(() => { setUpdatingAppId(null); loadGames(); }, 2000);
          } else if (parsed.error) {
            setTimeout(() => setUpdatingAppId(null), 5000);
          } else {
            setUpdatingAppId(null);
          }
        }
      } catch (e) {
        console.error("Gurren: download poll error", e);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [updatingAppId]);

  // ── Resume in-progress tasks on mount ──────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        // Resume update check if it was already running
        const checkRes    = await getCheckUpdatesStatus();
        const checkParsed = JSON.parse(checkRes);
        if (checkParsed.running) setCheckingUpdates(true);

        // Load game list and resume any active download
        const gamesRes    = await getAssellaGames();
        const gamesParsed = JSON.parse(gamesRes);
        if (gamesParsed.success) {
          setGames(gamesParsed.games);
          for (const game of gamesParsed.games) {
            const sRes    = await getUpdateGameStatus(parseInt(game.appid));
            const sParsed = JSON.parse(sRes);
            if (sParsed.running) { setUpdatingAppId(game.appid); break; }
          }
        }
      } catch (e) {
        console.error("Gurren: init error", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  // Show only games that need attention: update available OR currently downloading
  const visibleGames = games.filter(
    g => g.update_status === "update_available" || updatingAppId === g.appid
  );
  const upToDateCount = games.filter(g => g.update_status === "up_to_date").length;
  const hasGames      = games.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: "#dcdedf" }}>
      <style>{`
        .gurren-game-name-container {
          overflow: hidden;
          white-space: nowrap;
          flex: 1;
          margin-right: 8px;
          text-align: left;
        }
        .gurren-game-name-text {
          display: inline-block;
          white-space: nowrap;
          transition: transform 1.5s ease-in-out;
        }
        /* When focused/hovered, slide to show the end of long names */
        .gurren-game-name-container:hover .gurren-game-name-text,
        button:focus .gurren-game-name-text,
        [data-focused="true"] .gurren-game-name-text,
        :focus-within .gurren-game-name-text {
          transform: translateX(min(0px, calc(-100% + 150px)));
        }
      `}</style>

      {/* ── Check Updates / Progress ─────────────────────────────────────── */}
      <PanelSection title="Gurren">
        <PanelSectionRow>
          {checkingUpdates ? (
            <div style={{ width: "100%", padding: "4px 0" }}>
              <div style={{ fontSize: "12px", marginBottom: "6px", color: "#C06C84" }}>
                {checkStatusMsg}
              </div>
              <ProgressBar nProgress={checkProgress / 100} />
            </div>
          ) : (
            <ButtonItem
              layout="below"
              onClick={handleCheckUpdates}
              disabled={!!updatingAppId}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                     stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Check for Updates
              </div>
            </ButtonItem>
          )}
        </PanelSectionRow>

        {/* Summary line shown when not checking */}
        {!checkingUpdates && hasGames && (
          <PanelSectionRow>
            <div style={{ fontSize: "11px", color: "#8b929a", padding: "2px 0" }}>
              {visibleGames.length === 0
                ? `✓ All ${upToDateCount} game${upToDateCount !== 1 ? "s" : ""} are up to date`
                : `${visibleGames.length} update${visibleGames.length !== 1 ? "s" : ""} available · ${upToDateCount} up to date`
              }
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>

      {/* ── Updates Available ────────────────────────────────────────────── */}
      {loading ? (
        <PanelSection title="Updates">
          <PanelSectionRow>
            <div style={{ textAlign: "center", padding: "12px", color: "#8b929a", fontSize: "12px" }}>
              Scanning libraries...
            </div>
          </PanelSectionRow>
        </PanelSection>
      ) : visibleGames.length === 0 ? (
        <PanelSection title="Updates">
          <PanelSectionRow>
            <div style={{ textAlign: "center", padding: "12px", color: "#8b929a", fontSize: "12px" }}>
              {games.length === 0
                ? "No ASSella-managed games found."
                : "No updates available."}
            </div>
          </PanelSectionRow>
        </PanelSection>
      ) : (
        <PanelSection title="Updates Available">
          {visibleGames.map((game) => {
            const isUpdating = updatingAppId === game.appid;

            if (isUpdating) {
              // ── Downloading: show progress + cancel button as separate rows ──
              return (
                <React.Fragment key={game.appid}>
                  {/* Game name + status (non-interactive info row) */}
                  <PanelSectionRow>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%"
                    }}>
                      <div className="gurren-game-name-container">
                        <span className="gurren-game-name-text" style={{ fontWeight: "bold", fontSize: "13px" }}>
                          {game.name}
                        </span>
                      </div>
                      <span style={{
                        fontSize: "11px", color: "#C06C84", fontWeight: "bold",
                        background: "rgba(192,108,132,0.15)",
                        padding: "2px 6px", borderRadius: "4px"
                      }}>
                        Updating...
                      </span>
                    </div>
                  </PanelSectionRow>

                  {/* Progress bar row */}
                  <PanelSectionRow>
                    <div style={{ width: "100%" }}>
                      <div style={{ fontSize: "11px", marginBottom: "5px", color: "#ffeb3b" }}>
                        {updateStatusMsg}
                      </div>
                      <ProgressBar nProgress={updateProgress / 100} />
                    </div>
                  </PanelSectionRow>

                  {/* Cancel button — controller focusable via ButtonItem */}
                  <PanelSectionRow>
                    <ButtonItem
                      layout="below"
                      onClick={() => handleCancelUpdate(game.appid)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f44336" }}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                             stroke="currentColor" strokeWidth="2.5"
                             strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Cancel Update
                      </div>
                    </ButtonItem>
                  </PanelSectionRow>
                </React.Fragment>
              );
            }

            // ── Update available: single ButtonItem per game (controller focusable) ──
            return (
              <PanelSectionRow key={game.appid}>
                <ButtonItem
                  layout="below"
                  onClick={() => handleUpdateGame(game.appid)}
                  disabled={!!updatingAppId}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    gap: "8px"
                  }}>
                    <div className="gurren-game-name-container">
                      <span className="gurren-game-name-text" style={{ fontWeight: "bold", fontSize: "13px" }}>
                        {game.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "11px",
                      color: "#4caf50",
                      fontWeight: "bold",
                      background: "rgba(76,175,80,0.15)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      flexShrink: 0
                    }}>
                      Update ↓
                    </span>
                  </div>
                </ButtonItem>
              </PanelSectionRow>
            );
          })}
        </PanelSection>
      )}

      {/* ── Refresh ──────────────────────────────────────────────────────── */}
      <PanelSection title="Options">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={loadGames}
            disabled={loading || checkingUpdates || !!updatingAppId}
          >
            Refresh
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </div>
  );
};

export default definePlugin(() => {
  return {
    name: "Gurren",
    titleView: <div className={staticClasses.Title}>Gurren — ASSella Manager</div>,
    content: <GurrenApp />,
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
           stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    ),
    onDismount() {}
  };
});
