import React, { useState, useEffect } from "react";
import { PanelSection, PanelSectionRow, ButtonItem, ToggleField, Focusable } from "@decky/ui";
import { Backend } from "../Utils/Backend";
import { StatusBar } from "./StatusBar";
import { GameCard } from "../Components/GameCard";

export const QAMPanel: React.FC = () => {
  const [, setTick] = useState(0);
  const [showUpToDate, setShowUpToDate] = useState(false);

  useEffect(() => {
    // Subscribe to state changes from Backend
    const unsubscribe = Backend.subscribe(() => setTick((t) => t + 1));
    return unsubscribe;
  }, []);

  const handleCheckUpdates = async () => {
    await Backend.triggerUpdateCheck();
  };

  const handleUpdateAll = () => {
    Backend.queueAllUpdates();
  };

  const handleRefresh = async () => {
    await Backend.loadGames();
  };

  // Filter game list:
  // By default, only show games that have updates or are actively updating/queued (minimal UI).
  // When showUpToDate is toggled, it expands to show all games.
  const visibleGames = Backend.games.filter(
    (g) =>
      g.update_status === "update_available" ||
      Backend.updatingAppId === g.appid ||
      Backend.downloadQueue.includes(g.appid) ||
      showUpToDate
  );

  const upToDateCount = Backend.games.filter((g) => g.update_status === "up_to_date").length;
  const updatableCount = Backend.games.filter((g) => g.update_status === "update_available").length;

  return (
    <div style={{ color: "#dcdedf" }}>
      {/* Sliding game name hover CSS */}
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
        .gurren-game-name-container:hover .gurren-game-name-text,
        button:focus .gurren-game-name-text,
        [data-focused="true"] .gurren-game-name-text,
        :focus-within .gurren-game-name-text {
          transform: translateX(min(0px, calc(-100% + 150px)));
        }
      `}</style>

      {/* ── Status Bar & Main Action Buttons ── */}
      <PanelSection title="Gurren">
        <StatusBar />

        <PanelSectionRow>
          <Focusable style={{ display: "flex", gap: "6px", width: "100%" }} flow-children="horizontal">
            <div style={{ flex: 1 }}>
              <ButtonItem
                layout="below"
                onClick={handleCheckUpdates}
                disabled={Backend.checkingUpdates || !!Backend.updatingAppId}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                       stroke="currentColor" strokeWidth="2.5"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  Check
                </div>
              </ButtonItem>
            </div>

            <div style={{ flex: 1 }}>
              <ButtonItem
                layout="below"
                onClick={handleUpdateAll}
                disabled={Backend.checkingUpdates || updatableCount === 0 || !!Backend.updatingAppId}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                       stroke="currentColor" strokeWidth="2.5"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Update All
                </div>
              </ButtonItem>
            </div>

            <div style={{ flex: 1 }}>
              <ButtonItem
                layout="below"
                onClick={handleRefresh}
                disabled={Backend.loading || Backend.checkingUpdates || !!Backend.updatingAppId}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                       stroke="currentColor" strokeWidth="2.5"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Refresh
                </div>
              </ButtonItem>
            </div>
          </Focusable>
        </PanelSectionRow>

        {/* Summary Details */}
        {!Backend.checkingUpdates && Backend.games.length > 0 && (
          <PanelSectionRow>
            <div style={{ fontSize: "11px", color: "#8b929a", padding: "2px 0" }}>
              {updatableCount === 0
                ? `✓ All ${upToDateCount} games are up to date`
                : `${updatableCount} update${updatableCount !== 1 ? "s" : ""} available · ${upToDateCount} up to date`
              }
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>

      {/* ── Games List ── */}
      <PanelSection title={showUpToDate ? "All ASSella Games" : "Updates Available"}>
        {Backend.loading ? (
          <PanelSectionRow>
            <div style={{ textAlign: "center", padding: "12px", color: "#8b929a", fontSize: "12px" }}>
              Scanning libraries...
            </div>
          </PanelSectionRow>
        ) : visibleGames.length === 0 ? (
          <PanelSectionRow>
            <div style={{ textAlign: "center", padding: "12px", color: "#8b929a", fontSize: "12px" }}>
              {Backend.games.length === 0
                ? "No ASSella-managed games found."
                : "No updates available."}
            </div>
          </PanelSectionRow>
        ) : (
          visibleGames.map((game) => (
            <GameCard key={game.appid} game={game} />
          ))
        )}
      </PanelSection>

      {/* ── Expanded UI Options ── */}
      {Backend.games.length > 0 && (
        <PanelSection title="UI Options">
          <PanelSectionRow>
            <ToggleField
              label="Show Up-to-Date Games"
              checked={showUpToDate}
              onChange={(checked) => setShowUpToDate(checked)}
            />
          </PanelSectionRow>
        </PanelSection>
      )}
    </div>
  );
};
