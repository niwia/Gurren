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

// Register typed python callable endpoints
const getAssellaGames = callable<[], string>("get_assella_games");
const checkUpdatesAll = callable<[], string>("check_updates_all");
const getCheckUpdatesStatus = callable<[], string>("get_check_updates_status");
const updateGame = callable<[appid: number], string>("update_game");
const getUpdateGameStatus = callable<[appid: number], string>("get_update_game_status");
const cancelUpdateGame = callable<[appid: number], string>("cancel_update_game");

const ASSellaApp: React.FC = () => {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Update checking state
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);
  const [checkStatusMsg, setCheckStatusMsg] = useState("");

  // Game update downloading state
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatusMsg, setUpdateStatusMsg] = useState("");

  const loadGames = async () => {
    setLoading(true);
    try {
      const res = await getAssellaGames();
      const parsed = JSON.parse(res);
      if (parsed.success) {
        setGames(parsed.games);
      }
    } catch (e) {
      console.error("Failed to load ASSella games", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUpdates = async () => {
    if (checkingUpdates) return;
    setCheckingUpdates(true);
    setCheckProgress(0);
    setCheckStatusMsg("Initializing update check...");
    try {
      const res = await checkUpdatesAll();
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
      const res = await updateGame(parseInt(appid));
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
      console.error("Failed to cancel update", e);
    }
  };

  // Poll for global update check status
  useEffect(() => {
    let interval: any;
    if (checkingUpdates) {
      interval = setInterval(async () => {
        try {
          const res = await getCheckUpdatesStatus();
          const parsed = JSON.parse(res);
          setCheckProgress(parsed.progress);
          setCheckStatusMsg(parsed.status_msg);
          if (parsed.completed || !parsed.running) {
            setCheckingUpdates(false);
            clearInterval(interval);
            loadGames();
          }
        } catch (e) {
          console.error("Error checking status", e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [checkingUpdates]);

  // Poll for game download status
  useEffect(() => {
    let interval: any;
    if (updatingAppId) {
      interval = setInterval(async () => {
        try {
          const res = await getUpdateGameStatus(parseInt(updatingAppId));
          const parsed = JSON.parse(res);
          setUpdateProgress(parsed.progress);
          setUpdateStatusMsg(parsed.status_msg);
          if (parsed.completed || parsed.error || !parsed.running) {
            clearInterval(interval);
            if (parsed.completed) {
              setTimeout(() => {
                setUpdatingAppId(null);
                loadGames();
              }, 2000);
            } else if (parsed.error) {
              setTimeout(() => {
                setUpdatingAppId(null);
              }, 5000);
            } else {
              setUpdatingAppId(null);
            }
          }
        } catch (e) {
          console.error("Error checking game update status", e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [updatingAppId]);

  // Check initial active tasks and load games on mount
  useEffect(() => {
    const checkActiveTasks = async () => {
      try {
        const checkRes = await getCheckUpdatesStatus();
        const checkParsed = JSON.parse(checkRes);
        if (checkParsed.running) {
          setCheckingUpdates(true);
        }

        const gamesRes = await getAssellaGames();
        const gamesParsed = JSON.parse(gamesRes);
        if (gamesParsed.success) {
          setGames(gamesParsed.games);
          for (const game of gamesParsed.games) {
            const statusRes = await getUpdateGameStatus(parseInt(game.appid));
            const statusParsed = JSON.parse(statusRes);
            if (statusParsed.running) {
              setUpdatingAppId(game.appid);
              break;
            }
          }
        }
      } catch (e) {
        console.error("Initialization error", e);
      } finally {
        setLoading(false);
      }
    };

    checkActiveTasks();
  }, []);

  return (
    <div style={{ padding: "8px", color: "#dcdedf" }}>
      {/* Check Updates Section */}
      <PanelSection title="ASSella Manager">
        <PanelSectionRow>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            {checkingUpdates ? (
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: "12px", marginBottom: "4px", color: "#C06C84" }}>
                  {checkStatusMsg}
                </div>
                <ProgressBar nProgress={checkProgress / 100} />
              </div>
            ) : (
              <ButtonItem
                layout="below"
                onClick={handleCheckUpdates}
                disabled={updatingAppId !== null}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  Check for Updates
                </div>
              </ButtonItem>
            )}
          </div>
        </PanelSectionRow>
      </PanelSection>

      {/* Installed Games Section */}
      <PanelSection title="ASSella Games">
        {loading ? (
          <PanelSectionRow>
            <div style={{ textAlign: "center", padding: "16px", color: "#8b929a" }}>
              Scanning libraries...
            </div>
          </PanelSectionRow>
        ) : games.length === 0 ? (
          <PanelSectionRow>
            <div style={{ textAlign: "center", padding: "16px", color: "#8b929a" }}>
              No ASSella-managed games found.
            </div>
          </PanelSectionRow>
        ) : (
          games.map((game) => {
            const isUpdating = updatingAppId === game.appid;
            const hasUpdate = game.update_status === "update_available";

            // Status colors and text
            let statusColor = "#a3a3a3";
            let statusText = "Up to Date";
            if (hasUpdate) {
              statusColor = "#4caf50";
              statusText = "Update Available";
            } else if (game.update_status === "checking") {
              statusColor = "#ffeb3b";
              statusText = "Checking...";
            } else if (game.update_status === "cannot_determine") {
              statusColor = "#ff9800";
              statusText = "Cannot Determine";
            }

            return (
              <PanelSectionRow key={game.appid}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "10px",
                  borderRadius: "8px",
                  background: isUpdating ? "rgba(192, 108, 132, 0.1)" : "rgba(255, 255, 255, 0.05)",
                  border: isUpdating ? "1px solid #C06C84" : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  gap: "6px"
                }}>
                  {/* Game Details Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", fontWeight: "bold", fontSize: "14px" }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: isUpdating ? "#C06C84" : "#a3a3a3" }}>
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <path d="M12 12h.01M16 10v4M14 12h4M6 12h4M8 10v4" />
                      </svg>
                      {game.name}
                    </div>
                    <span style={{ fontSize: "11px", color: statusColor, fontWeight: "bold", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>
                      {statusText}
                    </span>
                  </div>

                  {/* AppID & Action */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#8b929a" }}>AppID: {game.appid}</span>
                    
                    {isUpdating ? (
                      <button
                        onClick={() => handleCancelUpdate(game.appid)}
                        style={{
                          background: "#f44336",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 10px",
                          fontSize: "11px",
                          cursor: "pointer",
                          outline: "none"
                        }}
                      >
                        Cancel
                      </button>
                    ) : hasUpdate ? (
                      <button
                        onClick={() => handleUpdateGame(game.appid)}
                        disabled={updatingAppId !== null}
                        style={{
                          background: "#4caf50",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          opacity: updatingAppId !== null ? 0.5 : 1,
                          outline: "none"
                        }}
                      >
                        Update
                      </button>
                    ) : null}
                  </div>

                  {/* Update Progress Bar */}
                  {isUpdating && (
                    <div style={{ marginTop: "8px", width: "100%" }}>
                      <div style={{ fontSize: "11px", marginBottom: "4px", color: "#ffeb3b" }}>
                        {updateStatusMsg}
                      </div>
                      <ProgressBar nProgress={updateProgress / 100} />
                    </div>
                  )}
                </div>
              </PanelSectionRow>
            );
          })
        )}
      </PanelSection>

      {/* Utilities Section */}
      <PanelSection title="Options">
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={loadGames} disabled={loading || checkingUpdates || updatingAppId !== null}>
            Refresh Games List
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
    content: <ASSellaApp />,
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    ),
    onDismount() {}
  };
});
