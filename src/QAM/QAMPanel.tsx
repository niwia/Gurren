import React, { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  DialogButton,
  Focusable,
  Navigation,
  staticClasses
} from "@decky/ui";
import { Backend } from "../Utils/Backend";
import { StatusBar } from "./StatusBar";
import { GameCard } from "../Components/GameCard";
import { GurrenCSS } from "./Gurren.css";

export const QAMPanel: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = Backend.subscribe(() => setTick((t) => t + 1));
    return unsubscribe;
  }, []);

  const handleCheckUpdates = async () => { await Backend.triggerUpdateCheck(); };
  const handleUpdateAll    = () => { Backend.queueAllUpdates(); };
  const handleRefresh      = async () => { await Backend.loadGames(); };
  const handleOpenManager  = () => {
    Navigation.CloseSideMenus();
    Navigation.Navigate("/gurren-manager");
  };

  // QAM view only shows games that actually need attention (updates, active downloading, queued)
  const updatableGames = Backend.games.filter(
    (g) =>
      g.update_status === "update_available" ||
      Backend.updatingAppId === g.appid ||
      Backend.downloadQueue.includes(g.appid)
  );

  const upToDateCount  = Backend.games.filter((g) => g.update_status === "up_to_date").length;
  const updatableCount = Backend.games.filter((g) => g.update_status === "update_available").length;
  const isBusy = Backend.checkingUpdates || !!Backend.updatingAppId;

  return (
    <PanelSection>
      {/* ── Status pill ── */}
      <StatusBar />

      {/* ── Action buttons row ── */}
      <PanelSectionRow>
        <Focusable style={{ display: "flex" }} flow-children="horizontal">
          {/* Check updates */}
          <DialogButton
            style={GurrenCSS.actionButton}
            disabled={isBusy}
            onClick={handleCheckUpdates}
            onOKActionDescription="Check updates"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                 stroke="currentColor" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </DialogButton>

          {/* Update all */}
          <DialogButton
            style={GurrenCSS.actionButton}
            disabled={isBusy || updatableCount === 0}
            onClick={handleUpdateAll}
            onOKActionDescription="Update all"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                 stroke="currentColor" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </DialogButton>

          {/* Refresh library */}
          <DialogButton
            style={GurrenCSS.actionButton}
            disabled={Backend.loading || isBusy}
            onClick={handleRefresh}
            onOKActionDescription="Refresh library"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                 stroke="currentColor" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </DialogButton>

          {/* Open full manager page */}
          <DialogButton
            style={GurrenCSS.actionButton}
            onClick={handleOpenManager}
            onOKActionDescription="Open manager"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                 stroke="currentColor" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </DialogButton>
        </Focusable>
      </PanelSectionRow>

      {/* ── Summary line ── */}
      {!Backend.checkingUpdates && Backend.games.length > 0 && (
        <PanelSectionRow>
          <div style={GurrenCSS.summaryText}>
            {updatableCount === 0
              ? `✓ All ${upToDateCount} games up to date`
              : `${updatableCount} update${updatableCount !== 1 ? "s" : ""} available`}
          </div>
        </PanelSectionRow>
      )}

      {/* ── Games list ── */}
      <div className={staticClasses.PanelSectionTitle}>Updates Available</div>

      {Backend.loading ? (
        <PanelSectionRow>
          <div style={{ ...GurrenCSS.summaryText, textAlign: "center", padding: "10px 0" }}>
            Scanning libraries...
          </div>
        </PanelSectionRow>
      ) : updatableGames.length === 0 ? (
        <PanelSectionRow>
          <div style={{ ...GurrenCSS.summaryText, textAlign: "center", padding: "10px 0" }}>
            No updates available.
          </div>
        </PanelSectionRow>
      ) : (
        updatableGames.map((game) => <GameCard key={game.appid} game={game} />)
      )}

      {/* ── Footer ── */}
      <div style={GurrenCSS.footer}>Gurren v1.2.3</div>
    </PanelSection>
  );
};
