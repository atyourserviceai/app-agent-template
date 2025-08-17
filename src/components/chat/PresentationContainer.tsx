import { Card } from "@/components/card/Card";
import type { AgentMode, AppAgentState } from "../../agent/AppAgent";
import { ModeInfoCard } from "./ModeInfoCard";
import { PresentationPanel } from "./PresentationPanel";

type PresentationContainerProps = {
  activeTab: "chat" | "presentation";
  agentMode: AgentMode;
  agentState: AppAgentState | null;
  showDebug: boolean;
  variant?: "panel" | "full"; // full = full-screen background variant
};

export function PresentationContainer({
  activeTab,
  agentMode,
  agentState,
  showDebug,
  variant = "panel",
}: PresentationContainerProps) {
  // Initialize a default state if agentState is null
  const defaultState: AppAgentState = {
    isOnboardingComplete: false,
    mode: agentMode,
    onboardingStep: "start",
  };

  // Use the provided state or the default state
  const safeAgentState = agentState || defaultState;

  if (variant === "full") {
    return (
      <div className="h-full w-full overflow-hidden bg-white dark:bg-black">
        <div className="h-full flex flex-col pt-16 md:pt-0">
          <div className="flex-1 overflow-auto">
            <PresentationPanel
              agentState={safeAgentState}
              agentMode={agentMode}
              showDebug={showDebug}
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
      <div className="h-full flex flex-col">
        {/* Mode Info Card - Always visible as a separate card above the playbook panel */}
        <div className="p-4">
          <Card className="p-4 bg-neutral-100 dark:bg-neutral-900">
            <ModeInfoCard agentMode={agentMode} />
          </Card>
        </div>

        {/* Playbook content area */}
        <div className="flex-1 overflow-auto">
          <PresentationPanel
            agentState={safeAgentState}
            agentMode={agentMode}
            showDebug={showDebug}
          />
        </div>
      </div>
    </div>
  );
}
