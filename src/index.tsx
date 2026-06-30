import { definePlugin, routerHook } from "@decky/api";
import { staticClasses } from "@decky/ui";
import { QAMPanel } from "./QAM/QAMPanel";
import { GamesPage } from "./Pages/GamesPage";
import { Backend } from "./Utils/Backend";

export default definePlugin(() => {
  // Initialize backend connection, cache and queue
  Backend.init();

  if (routerHook) {
    routerHook.addRoute("/gurren-manager", GamesPage);
  }

  return {
    name: "Gurren",
    titleView: <div className={staticClasses.Title}>Gurren — ASSella Manager</div>,
    content: <QAMPanel />,
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
           stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    ),
    onDismount() {
      if (routerHook) {
        routerHook.removeRoute("/gurren-manager");
      }
      // Clear intervals and event subscriptions
      Backend.cleanup();
    }
  };
});
