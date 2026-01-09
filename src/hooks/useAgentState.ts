import { useAgent } from "agents/react";
import { useState } from "react";
import type { AgentMode, AppAgentState } from "../agent/AppAgent";

export function useAgentState(
  externalConfig: {
    agent: string;
    name: string;
    query?: Record<string, string>;
  } | null,
  initialMode: AgentMode = "act"
) {
  const [agentState, setAgentState] = useState<AppAgentState | null>(null);
  const [agentMode, setAgentMode] = useState<AgentMode>(initialMode);

  const agentConfig = externalConfig;

  const agent = useAgent({
    agent: agentConfig?.agent || "app-agent",
    name: agentConfig?.name || "unauthenticated",
    onStateUpdate: (newState: AppAgentState) => {
      if (!agentConfig) return;

      setAgentState(newState);

      // On initial load, use the agent's mode
      if (newState?.mode && !agentState) {
        setAgentMode(newState.mode);
      }
    },
    query: agentConfig?.query
  });

  // Simplified function to change the agent mode
  const changeAgentMode = async (newMode: AgentMode) => {
    if (agentMode === newMode) return;

    setAgentMode(newMode);

    // Call the agent's setMode method to update backend state
    if (agent && agentConfig?.agent && agentConfig?.name) {
      try {
        const setModeUrl = `/agents/${agentConfig.agent}/${agentConfig.name}/set-mode`;
        const urlObj = new URL(setModeUrl, window.location.origin);

        if (agentConfig.query) {
          for (const [k, v] of Object.entries(agentConfig.query)) {
            if (typeof v === "string") urlObj.searchParams.set(k, v);
          }
        }

        const response = await fetch(urlObj.toString(), {
          body: JSON.stringify({ mode: newMode }),
          headers: { "Content-Type": "application/json" },
          method: "POST"
        });

        if (!response.ok) {
          throw new Error(`Failed to change mode: ${response.statusText}`);
        }
      } catch (error) {
        console.error("Error changing mode:", error);
        // Reset back to the original mode on error
        setAgentMode(agentMode);
      }
    }
  };

  return {
    agent,
    agentState,
    agentMode,
    changeAgentMode
  };
}
