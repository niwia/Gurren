import React, { useState, useEffect } from "react";
import { PanelSectionRow } from "@decky/ui";
import { Backend } from "../Utils/Backend";
import { StatusBarCSS } from "./StatusBar.css";

export const StatusBar: React.FC = () => {
  // Local state triggered by backend notify pub/sub
  const [, setTick] = useState(0);

  useEffect(() => {
    // Subscribe to backend updates to force component updates
    const unsubscribe = Backend.subscribe(() => setTick((t) => t + 1));
    return unsubscribe;
  }, []);

  let statusText = "";
  let cssStyle = StatusBarCSS.Default;
  let show = false;

  const updatableCount = Backend.games.filter(
    (g) => g.update_status === "update_available"
  ).length;

  if (Backend.checkingUpdates) {
    statusText = Backend.checkStatusMsg || `Checking updates... ${Backend.checkProgress}%`;
    cssStyle = StatusBarCSS.CheckForUpdates;
    show = true;
  } else if (Backend.updatingAppId) {
    const game = Backend.games.find((g) => g.appid === Backend.updatingAppId);
    const gameName = game ? game.name : "Game";
    const totalJobs = Backend.downloadQueue.length + 1;
    statusText = `Updating: ${gameName} (${Backend.updateProgress}%) [1/${totalJobs}]`;
    cssStyle = StatusBarCSS.Downloading;
    show = true;
  } else if (updatableCount > 0) {
    statusText = `${updatableCount} update${updatableCount !== 1 ? "s" : ""} available`;
    cssStyle = StatusBarCSS.Info;
    show = true;
  }

  if (!show) {
    return null;
  }

  return (
    <PanelSectionRow>
      <div style={cssStyle}>
        <div style={{ fontWeight: "bold" }}>{statusText}</div>
        {(Backend.checkingUpdates || Backend.updatingAppId) && (
          <div style={{ opacity: 0.8, fontSize: "10px" }}>
            {Backend.checkingUpdates ? `${Backend.checkProgress}%` : `${Backend.updateProgress}%`}
          </div>
        )}
      </div>
    </PanelSectionRow>
  );
};
