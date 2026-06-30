import React, { useState, useEffect } from "react";
import { PanelSectionRow } from "@decky/ui";
import { Backend } from "../Utils/Backend";
import { GurrenCSS } from "./Gurren.css";

// Spinner animation inline — tiny, matches autoflatpaks vibe
const spinnerSvg = (
  <svg
    viewBox="0 0 24 24" width="12" height="12"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: "gurren-spin 1s linear infinite", flexShrink: 0 }}
  >
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

export const StatusBar: React.FC = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = Backend.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const updatableCount = Backend.games.filter(
    (g) => g.update_status === "update_available"
  ).length;

  let statusText = "";
  let colorStyle: React.CSSProperties = {};
  let icon: React.ReactNode = null;
  let show = false;

  if (Backend.checkingUpdates) {
    statusText = Backend.checkStatusMsg || `Checking updates... ${Backend.checkProgress}%`;
    colorStyle = GurrenCSS.statusGreen;
    icon = spinnerSvg;
    show = true;
  } else if (Backend.updatingAppId) {
    const game = Backend.games.find((g) => g.appid === Backend.updatingAppId);
    const qTotal = Backend.downloadQueue.length + 1;
    statusText = `${game?.name ?? "Game"} — ${Backend.updateProgress}%  [1/${qTotal}]`;
    colorStyle = GurrenCSS.statusRed;
    icon = (
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    );
    show = true;
  } else if (updatableCount > 0) {
    statusText = `${updatableCount} update${updatableCount !== 1 ? "s" : ""} available`;
    colorStyle = GurrenCSS.statusYellow;
    icon = (
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
    show = true;
  }

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes gurren-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <PanelSectionRow>
        <div style={{ ...GurrenCSS.statusBarBase, ...colorStyle }}>
          {icon}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {statusText}
          </span>
        </div>
      </PanelSectionRow>
    </>
  );
};
