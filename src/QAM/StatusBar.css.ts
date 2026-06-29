import { CSSProperties } from "react";
import { SteamCssVariables } from "../Utils/SteamUtils";

const StatusBarBase: CSSProperties = {
  color: "#ffffff",
  fontSize: "12px",
  padding: "6px 10px",
  borderRadius: "4px",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  boxSizing: "border-box"
};

export const StatusBarCSS: { [key: string]: CSSProperties } = {
  Default: {
    display: "none"
  },
  CheckForUpdates: {
    ...StatusBarBase,
    backgroundColor: SteamCssVariables.customStatusGreen
  },
  Downloading: {
    ...StatusBarBase,
    backgroundColor: SteamCssVariables.customStatusRed
  },
  Info: {
    ...StatusBarBase,
    backgroundColor: SteamCssVariables.customStatusYellow
  }
};
