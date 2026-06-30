import React from "react";
import { PanelSectionRow, DialogButton, Focusable, ProgressBar } from "@decky/ui";
import { GameInfo } from "../types";
import { Backend } from "../Utils/Backend";
import { GurrenCSS } from "../QAM/Gurren.css";

interface GameCardProps {
  game: GameInfo;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const isUpdating = Backend.updatingAppId === game.appid;
  const queueIdx   = Backend.downloadQueue.indexOf(game.appid);
  const isQueued   = queueIdx !== -1;

  // ── Downloading ──────────────────────────────────────────────────────────
  if (isUpdating) {
    return (
      <PanelSectionRow>
        <div style={{ width: "100%" }}>
          {/* Name + badge */}
          <div style={GurrenCSS.gameRow}>
            <span style={GurrenCSS.gameName}>{game.name}</span>
            <span style={{ ...GurrenCSS.badge, ...GurrenCSS.badgeBlue }}>
              {Backend.updateProgress}%
            </span>
            <DialogButton
              style={{ ...GurrenCSS.inlineBtn, color: "#f44336" }}
              onClick={() => Backend.dequeueDownload(game.appid)}
              onOKActionDescription="Cancel"
            >
              ✕
            </DialogButton>
          </div>

          {/* Progress */}
          <div style={GurrenCSS.progressWrap}>
            <div style={GurrenCSS.progressLabel}>
              {Backend.updateStatusMsg}
            </div>
            <ProgressBar nProgress={Backend.updateProgress / 100} />
          </div>
        </div>
      </PanelSectionRow>
    );
  }

  // ── Queued ───────────────────────────────────────────────────────────────
  if (isQueued) {
    return (
      <PanelSectionRow>
        <Focusable style={GurrenCSS.gameRow} flow-children="horizontal">
          <span style={GurrenCSS.gameName}>{game.name}</span>
          <span style={{ ...GurrenCSS.badge, ...GurrenCSS.badgeOrange }}>
            #{queueIdx + 1}
          </span>
          <DialogButton
            style={GurrenCSS.inlineBtn}
            onClick={() => Backend.dequeueDownload(game.appid)}
            onOKActionDescription="Remove from queue"
          >
            ✕
          </DialogButton>
        </Focusable>
      </PanelSectionRow>
    );
  }

  // ── Update available ─────────────────────────────────────────────────────
  if (game.update_status === "update_available") {
    return (
      <PanelSectionRow>
        <Focusable style={GurrenCSS.gameRow} flow-children="horizontal">
          <span style={GurrenCSS.gameName}>{game.name}</span>
          <DialogButton
            style={{ ...GurrenCSS.inlineBtn, color: "#4caf50" }}
            onClick={() => Backend.queueDownload(game.appid)}
            disabled={Backend.checkingUpdates}
            onOKActionDescription="Queue update"
          >
            ↓
          </DialogButton>
        </Focusable>
      </PanelSectionRow>
    );
  }

  // ── Up to date ───────────────────────────────────────────────────────────
  return (
    <PanelSectionRow>
      <div style={GurrenCSS.gameRow}>
        <span style={{ ...GurrenCSS.gameName, color: "#8b929a", fontWeight: "normal" }}>
          {game.name}
        </span>
        <span style={{ ...GurrenCSS.badge, ...GurrenCSS.badgeGray }}>✓</span>
      </div>
    </PanelSectionRow>
  );
};
