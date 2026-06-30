import React, { useState, useEffect } from "react";
import {
  Focusable,
  PanelSection,
  PanelSectionRow,
  DialogButton,
  ToggleField,
  SliderField,
  staticClasses
} from "@decky/ui";
import { Backend } from "../Utils/Backend";
import { StatusBar } from "../QAM/StatusBar";
import { GameCard } from "../Components/GameCard";
import { GurrenCSS } from "../QAM/Gurren.css";

export const GamesPage: React.FC = () => {
  const [, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUpdates, setShowOnlyUpdates] = useState(false);

  useEffect(() => {
    // Sync with backend state updates
    const unsubscribe = Backend.subscribe(() => setTick((t) => t + 1));
    return unsubscribe;
  }, []);

  const handleCheckUpdates = async () => { await Backend.triggerUpdateCheck(); };
  const handleUpdateAll    = () => { Backend.queueAllUpdates(); };
  const handleRefresh      = async () => { await Backend.loadGames(); };

  // Filter games based on search query and "only updates" toggle
  const filteredGames = Backend.games.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUpdates = !showOnlyUpdates || g.update_status === "update_available" || Backend.updatingAppId === g.appid || Backend.downloadQueue.includes(g.appid);
    return matchesSearch && matchesUpdates;
  });

  const updatableCount = Backend.games.filter((g) => g.update_status === "update_available").length;
  const isBusy = Backend.checkingUpdates || !!Backend.updatingAppId;

  return (
    <Focusable
      style={{
        width: "100%",
        height: "100%",
        padding: "40px 60px",
        boxSizing: "border-box",
        overflowY: "auto",
        color: "#dcdedf",
        background: "#1a1f24"
      }}
    >
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0, color: "#fff" }}>
            Gurren — ASSella Manager
          </h1>
          <p style={{ fontSize: "14px", color: "#8b929a", margin: "4px 0 0 0" }}>
            Manage and monitor your game depot updates and settings on the go.
          </p>
        </div>
        <div style={GurrenCSS.footer}>
          v1.2.3
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        {/* Left Side: Games List & Search */}
        <div style={{ flex: 2, minWidth: 0 }}>
          <PanelSection>
            {/* Status bar indicator */}
            <StatusBar />

            {/* Quick Actions Row */}
            <div className={staticClasses.PanelSectionTitle}>Actions</div>
            <PanelSectionRow>
              <Focusable style={{ display: "flex", gap: "10px" }} flow-children="horizontal">
                <DialogButton onClick={handleCheckUpdates} disabled={isBusy}>
                  Check for Updates
                </DialogButton>
                <DialogButton onClick={handleUpdateAll} disabled={isBusy || updatableCount === 0}>
                  Update All ({updatableCount})
                </DialogButton>
                <DialogButton onClick={handleRefresh} disabled={Backend.loading || isBusy}>
                  Refresh Library
                </DialogButton>
              </Focusable>
            </PanelSectionRow>

            {/* Filtering controls */}
            <div className={staticClasses.PanelSectionTitle}>Library Filtering</div>
            <PanelSectionRow>
              <Focusable style={{ display: "flex", gap: "16px", alignItems: "center" }} flow-children="horizontal">
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: "#262b32",
                    border: "1px solid #3d4450",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                />
                <ToggleField
                  label="Updates Only"
                  checked={showOnlyUpdates}
                  onChange={(v) => setShowOnlyUpdates(v)}
                />
              </Focusable>
            </PanelSectionRow>

            <div className={staticClasses.PanelSectionTitle}>
              Games ({filteredGames.length})
            </div>

            {Backend.loading ? (
              <PanelSectionRow>
                <div style={{ textAlign: "center", padding: "20px", color: "#8b929a" }}>
                  Scanning game directories...
                </div>
              </PanelSectionRow>
            ) : filteredGames.length === 0 ? (
              <PanelSectionRow>
                <div style={{ textAlign: "center", padding: "20px", color: "#8b929a" }}>
                  {searchQuery ? "No games match search query." : "No games found."}
                </div>
              </PanelSectionRow>
            ) : (
              filteredGames.map((game) => (
                <GameCard key={game.appid} game={game} />
              ))
            )}
          </PanelSection>
        </div>

        {/* Right Side: Global Settings */}
        <div style={{ flex: 1, minWidth: "300px" }}>
          <PanelSection>
            <div className={staticClasses.PanelSectionTitle}>Global ASSella Settings</div>

            <PanelSectionRow>
              <ToggleField
                label="Auto DRM Removal (Steamless)"
                checked={Backend.config.use_steamless}
                onChange={(v) => Backend.updateConfig({ use_steamless: v })}
              />
            </PanelSectionRow>

            <PanelSectionRow>
              <ToggleField
                label="Auto Generate Achievements"
                checked={Backend.config.generate_achievements}
                onChange={(v) => Backend.updateConfig({ generate_achievements: v })}
              />
            </PanelSectionRow>

            <PanelSectionRow>
              <ToggleField
                label="Keep Old Manifests"
                checked={Backend.config.save_old_manifests}
                onChange={(v) => Backend.updateConfig({ save_old_manifests: v })}
              />
            </PanelSectionRow>

            <PanelSectionRow>
              <ToggleField
                label="Apply Goldberg Emulator"
                checked={Backend.config.auto_apply_goldberg}
                onChange={(v) => Backend.updateConfig({ auto_apply_goldberg: v })}
              />
            </PanelSectionRow>

            <PanelSectionRow>
              <SliderField
                label="Concurrent Downloads"
                value={Backend.config.max_downloads}
                min={1} max={8} step={1}
                showValue={true}
                onChange={(v) => Backend.updateConfig({ max_downloads: v })}
              />
            </PanelSectionRow>
          </PanelSection>
        </div>
      </div>
    </Focusable>
  );
};
