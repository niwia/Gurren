import { CSSProperties } from "react";
import { SteamCssVariables } from "../Utils/SteamUtils";

export const GameCardCSS: { [key: string]: CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    boxSizing: "border-box"
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: "8px"
  },
  nameContainer: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    flex: 1,
    marginRight: "8px",
    textAlign: "left"
  },
  nameText: {
    display: "inline-block",
    whiteSpace: "nowrap",
    fontWeight: "bold",
    fontSize: "13px",
    color: SteamCssVariables.mainTextColor
  },
  badge: {
    fontSize: "11px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "4px",
    flexShrink: 0
  },
  badgeUpdateAvailable: {
    color: "#4caf50",
    background: "rgba(76,175,80,0.15)"
  },
  badgeQueued: {
    color: "#ffa726",
    background: "rgba(255,167,38,0.15)"
  },
  badgeUpdating: {
    color: "#90caf9",
    background: "rgba(144,202,249,0.15)"
  },
  badgeUpToDate: {
    color: "#8b929a",
    background: "rgba(139,146,154,0.1)"
  },
  progressRow: {
    marginTop: "6px",
    width: "100%"
  },
  progressText: {
    fontSize: "11px",
    marginBottom: "4px",
    color: "#ffeb3b"
  },
  cancelButton: {
    color: "#f44336"
  }
};
