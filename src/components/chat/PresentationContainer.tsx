import type { AgentMode, AppAgentState } from "../../agent/AppAgent";
import { PresentationPanel } from "./PresentationPanel";

type PresentationContainerProps = {
  activeTab: "chat" | "presentation";
  agentMode: AgentMode;
  agentState: AppAgentState | null;
  showDebug: boolean;
  variant?: "panel" | "full"; // full = full-screen background variant
  onShowLandingPage?: () => void;
};

export function PresentationContainer({
  activeTab,
  agentMode,
  agentState,
  showDebug,
  variant = "panel",
  onShowLandingPage
}: PresentationContainerProps) {
  // Initialize a default state if agentState is null
  const defaultState: AppAgentState = {
    mode: agentMode
  };

  // Use the provided state or the default state
  const safeAgentState = agentState || defaultState;

  if (variant === "full") {
    return (
      <div className="h-full w-full overflow-hidden bg-white dark:bg-black">
        <div className="h-full flex flex-col pt-16 md:pt-0">
          <div className="flex-1 overflow-hidden">
            <PresentationPanel
              agentState={safeAgentState}
              agentMode={agentMode}
              showDebug={showDebug}
              onShowLandingPage={onShowLandingPage}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full md:w-2/5 lg:w-2/5 max-w-[600px] flex-shrink-0 shadow-xl rounded-md overflow-hidden relative border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-black ${
        activeTab === "presentation" ? "block" : "hidden md:block"
      }`}
    >
      <PresentationPanel
        agentState={safeAgentState}
        agentMode={agentMode}
        showDebug={showDebug}
        onShowLandingPage={onShowLandingPage}
      />
    </div>
  );
}
