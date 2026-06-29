import React from "react";
import { PanelSectionRow, ButtonItem, ProgressBar } from "@decky/ui";
import { GameInfo } from "../types";
import { Backend } from "../Utils/Backend";
import { GameCardCSS } from "./GameCard.css";

interface GameCardProps {
  game: GameInfo;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const isUpdating = Backend.updatingAppId === game.appid;
  const queueIdx = Backend.downloadQueue.indexOf(game.appid);
  const isQueued = queueIdx !== -1;

  // 1. Downloading state
  if (isUpdating) {
    return (
      <React.Fragment>
        {/* Game Name + Status Header */}
        <PanelSectionRow>
          <div style={GameCardCSS.headerRow}>
            <div className="gurren-game-name-container">
              <span className="gurren-game-name-text" style={GameCardCSS.nameText}>
                {game.name}
              </span>
            </div>
            <span style={{ ...GameCardCSS.badge, ...GameCardCSS.badgeUpdating }}>
              Updating...
            </span>
          </div>
        </PanelSectionRow>

        {/* Progress details */}
        <PanelSectionRow>
          <div style={GameCardCSS.progressRow}>
            <div style={GameCardCSS.progressText}>
              {Backend.updateStatusMsg}
            </div>
            <ProgressBar nProgress={Backend.updateProgress / 100} />
          </div>
        </PanelSectionRow>

        {/* Cancel Action */}
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => Backend.dequeueDownload(game.appid)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
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

  // 2. Queued state
  if (isQueued) {
    return (
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => Backend.dequeueDownload(game.appid)}
        >
          <div style={GameCardCSS.headerRow}>
            <div className="gurren-game-name-container">
              <span className="gurren-game-name-text" style={GameCardCSS.nameText}>
                {game.name}
              </span>
            </div>
            <span style={{ ...GameCardCSS.badge, ...GameCardCSS.badgeQueued }}>
              Queued (#{queueIdx + 1}) ✕
            </span>
          </div>
        </ButtonItem>
      </PanelSectionRow>
    );
  }

  // 3. Updatable state
  if (game.update_status === "update_available") {
    return (
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => Backend.queueDownload(game.appid)}
          disabled={Backend.checkingUpdates}
        >
          <div style={GameCardCSS.headerRow}>
            <div className="gurren-game-name-container">
              <span className="gurren-game-name-text" style={GameCardCSS.nameText}>
                {game.name}
              </span>
            </div>
            <span style={{ ...GameCardCSS.badge, ...GameCardCSS.badgeUpdateAvailable }}>
              Update ↓
            </span>
          </div>
        </ButtonItem>
      </PanelSectionRow>
    );
  }

  // 4. Default Up-to-date state
  return (
    <PanelSectionRow>
      <ButtonItem
        layout="below"
        onClick={() => Backend.loadGames()}
        disabled={Backend.loading || Backend.checkingUpdates || !!Backend.updatingAppId}
      >
        <div style={GameCardCSS.headerRow}>
          <div className="gurren-game-name-container">
            <span className="gurren-game-name-text" style={GameCardCSS.nameText}>
              {game.name}
            </span>
          </div>
          <span style={{ ...GameCardCSS.badge, ...GameCardCSS.badgeUpToDate }}>
            Up to date ✓
          </span>
        </div>
      </ButtonItem>
    </PanelSectionRow>
  );
};
