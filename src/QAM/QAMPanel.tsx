import React, { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  DialogButton,
  ToggleField,
  SliderField,
  Focusable,
  staticClasses
} from "@decky/ui";
import { Backend } from "../Utils/Backend";
import { StatusBar } from "./StatusBar";
import { GameCard } from "../Components/GameCard";
import { GurrenCSS } from "./Gurren.css";

export const QAMPanel: React.FC = () => {
  const [, setTick] = useState(0);
  const [showUpToDate, setShowUpToDate] = useState(false);

  useEffect(() => {
    const unsubscribe = Backend.subscribe(() => setTick((t) => t + 1));
    return unsubscribe;
  }, []);

  const handleCheckUpdates = async () => { await Backend.triggerUpdateCheck(); };
  const handleUpdateAll    = () => { Backend.queueAllUpdates(); };
  const handleRefresh      = async () => { await Backend.loadGames(); };

  const visibleGames = Backend.games.filter(
    (g) =>
      g.update_status === "update_available" ||
      Backend.updatingAppId === g.appid ||
      Backend.downloadQueue.includes(g.appid) ||
      showUpToDate
  );

  const upToDateCount  = Backend.games.filter((g) => g.update_status === "up_to_date").length;
  const updatableCount = Backend.games.filter((g) => g.update_status === "update_available").length;
  const isBusy = Backend.checkingUpdates || !!Backend.updatingAppId;

  return (
    <PanelSection>
      {/* ── Status pill ── */}
      <StatusBar />

      {/* ── Action buttons (icon-only, compact — autoflatpaks style) ── */}
      <PanelSectionRow>
        <Focusable style={{ display: "flex" }} flow-children="horizontal">

          {/* Check updates */}
          <DialogButton
            style={GurrenCSS.actionButton}
            disabled={isBusy}
            onClick={handleCheckUpdates}
            onOKActionDescription="Check for updates"
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
            onOKActionDescription="Update all games"
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
            onOKActionDescription="Refresh game library"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                 stroke="currentColor" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
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
              : `${updatableCount} update${updatableCount !== 1 ? "s" : ""} available · ${upToDateCount} up to date`}
          </div>
        </PanelSectionRow>
      )}

      {/* ── Games list ── */}
      <div className={staticClasses.PanelSectionTitle}>
        {showUpToDate ? "All ASSella Games" : "Updates Available"}
      </div>

      {Backend.loading ? (
        <PanelSectionRow>
          <div style={{ ...GurrenCSS.summaryText, textAlign: "center", padding: "10px 0" }}>
            Scanning libraries...
          </div>
        </PanelSectionRow>
      ) : visibleGames.length === 0 ? (
        <PanelSectionRow>
          <div style={{ ...GurrenCSS.summaryText, textAlign: "center", padding: "10px 0" }}>
            {Backend.games.length === 0 ? "No ASSella-managed games found." : "No updates available."}
          </div>
        </PanelSectionRow>
      ) : (
        visibleGames.map((game) => <GameCard key={game.appid} game={game} />)
      )}

      {/* ── UI Options ── */}
      {Backend.games.length > 0 && (
        <>
          <div className={staticClasses.PanelSectionTitle}>Options</div>
          <PanelSectionRow>
            <ToggleField
              label="Show Up-to-Date Games"
              checked={showUpToDate}
              onChange={(v) => setShowUpToDate(v)}
            />
          </PanelSectionRow>
        </>
      )}

      {/* ── ASSella Settings ── */}
      {Backend.games.length > 0 && (
        <>
          <div className={staticClasses.PanelSectionTitle}>ASSella Settings</div>

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
        </>
      )}

      {/* ── Footer ── */}
      <div style={GurrenCSS.footer}>Gurren v1.2.2</div>
    </PanelSection>
  );
};
