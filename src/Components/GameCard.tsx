import React from "react";
import { PanelSectionRow, DialogButton, ProgressBar } from "@decky/ui";
import { GameInfo } from "../types";
import { Backend } from "../Utils/Backend";

interface GameCardProps {
  game: GameInfo;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const isUpdating = Backend.updatingAppId === game.appid;
  const queueIdx   = Backend.downloadQueue.indexOf(game.appid);
  const isQueued   = queueIdx !== -1;

  // 1. Downloading State (Renders as a status block with details, progress bar and cancel button)
  if (isUpdating) {
    return (
      <PanelSectionRow>
        <div
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "rgba(144,202,249,0.06)",
            borderRadius: "6px",
            border: "1px solid rgba(144,202,249,0.15)",
            boxSizing: "border-box"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
                marginRight: "10px",
                fontWeight: "bold",
                color: "#90caf9",
                flex: 1,
                textAlign: "left"
              }}
            >
              {game.name}
            </span>
            <DialogButton
              style={{
                minWidth: "0px",
                padding: "6px 12px",
                fontSize: "11px",
                color: "#ff8a80",
                backgroundColor: "rgba(244,67,54,0.1)",
                border: "1px solid rgba(244,67,54,0.2)"
              }}
              onClick={() => Backend.dequeueDownload(game.appid)}
            >
              Cancel ✕
            </DialogButton>
          </div>
          <div style={{ marginTop: "8px" }}>
            <div style={{ fontSize: "11px", color: "#b0bec5", marginBottom: "4px", textAlign: "left" }}>
              {Backend.updateStatusMsg}
            </div>
            <ProgressBar nProgress={Backend.updateProgress / 100} />
          </div>
        </div>
      </PanelSectionRow>
    );
  }

  // 2. Queued State (Renders as a list-button, click cancels/dequeues)
  if (isQueued) {
    return (
      <PanelSectionRow>
        <DialogButton
          style={{ width: "100%", padding: "10px 14px" }}
          onClick={() => Backend.dequeueDownload(game.appid)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
                marginRight: "10px",
                fontWeight: "bold",
                flex: 1,
                textAlign: "left"
              }}
            >
              {game.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                color: "#ffa726",
                background: "rgba(255,167,38,0.15)",
                padding: "2px 8px",
                borderRadius: "4px",
                flexShrink: 0
              }}
            >
              Queued (#{queueIdx + 1}) ✕
            </span>
          </div>
        </DialogButton>
      </PanelSectionRow>
    );
  }

  // 3. Update Available (Renders as a list-button, click starts/queues download)
  if (game.update_status === "update_available") {
    return (
      <PanelSectionRow>
        <DialogButton
          style={{ width: "100%", padding: "10px 14px" }}
          onClick={() => Backend.queueDownload(game.appid)}
          disabled={Backend.checkingUpdates}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
                marginRight: "10px",
                fontWeight: "bold",
                flex: 1,
                textAlign: "left"
              }}
            >
              {game.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                color: "#81c784",
                background: "rgba(76,175,80,0.15)",
                padding: "2px 8px",
                borderRadius: "4px",
                flexShrink: 0
              }}
            >
              Update ↓
            </span>
          </div>
        </DialogButton>
      </PanelSectionRow>
    );
  }

  // 4. Up-to-date State (Disabled list-button showing up-to-date badge)
  return (
    <PanelSectionRow>
      <DialogButton
        style={{ width: "100%", padding: "10px 14px" }}
        disabled
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", opacity: 0.65 }}>
          <span
            style={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
              marginRight: "10px",
              flex: 1,
              textAlign: "left"
            }}
          >
            {game.name}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              color: "#90a4ae",
              background: "rgba(144,164,174,0.12)",
              padding: "2px 8px",
              borderRadius: "4px",
              flexShrink: 0
            }}
          >
            ✓ Up to date
          </span>
        </div>
      </DialogButton>
    </PanelSectionRow>
  );
};
