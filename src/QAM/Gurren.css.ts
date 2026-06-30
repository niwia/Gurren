import { CSSProperties } from "react";

export const GurrenCSS: { [key: string]: CSSProperties } = {
  // ── Action buttons row (icon-only compact buttons like autoflatpaks) ──────
  actionButton: {
    minWidth: "0",
    padding: "10px 0px",
    margin: "1px",
    flex: 1
  },

  // ── Status bar pill ───────────────────────────────────────────────────────
  statusBarBase: {
    color: "#ffffff",
    fontSize: "12px",
    padding: "5px 10px",
    borderRadius: "4px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    boxSizing: "border-box" as const,
    userSelect: "none" as const
  },
  statusGreen: { backgroundColor: "rgba(76,175,80,0.75)" },
  statusRed: { backgroundColor: "rgba(244,67,54,0.75)" },
  statusYellow: { backgroundColor: "rgba(255,167,38,0.75)" },

  // ── Summary line ──────────────────────────────────────────────────────────
  summaryText: {
    fontSize: "11px",
    color: "#8b929a",
    padding: "2px 0",
    lineHeight: "1.4"
  },

  // ── Section header label (mimics staticClasses.PanelSectionTitle style) ──
  sectionTitle: {
    fontSize: "12px",
    color: "#8b929a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    padding: "10px 0 4px 0",
    fontWeight: "bold"
  },

  // ── Game row (slim, like a list item) ────────────────────────────────────
  gameRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: "6px"
  },
  gameName: {
    flex: 1,
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
    textOverflow: "ellipsis",
    fontSize: "13px",
    fontWeight: "bold",
    textAlign: "left" as const
  },

  // ── Inline action button (small, sits beside game name) ──────────────────
  inlineBtn: {
    minWidth: "0",
    padding: "4px 8px",
    fontSize: "11px",
    flexShrink: 0
  },

  // ── Progress row (under an active download game) ─────────────────────────
  progressWrap: {
    marginTop: "4px",
    width: "100%"
  },
  progressLabel: {
    fontSize: "10px",
    color: "#90caf9",
    marginBottom: "3px",
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
    textOverflow: "ellipsis"
  },

  // ── Status badges ─────────────────────────────────────────────────────────
  badge: {
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "4px",
    flexShrink: 0
  },
  badgeGreen: { color: "#4caf50", background: "rgba(76,175,80,0.18)" },
  badgeOrange: { color: "#ffa726", background: "rgba(255,167,38,0.18)" },
  badgeBlue: { color: "#90caf9", background: "rgba(144,202,249,0.18)" },
  badgeGray: { color: "#8b929a", background: "rgba(139,146,154,0.12)" },

  // ── Footer version ────────────────────────────────────────────────────────
  footer: {
    textAlign: "center" as const,
    fontSize: "10px",
    color: "#8b929a",
    marginTop: "12px",
    marginBottom: "2px",
    opacity: 0.5
  }
};
