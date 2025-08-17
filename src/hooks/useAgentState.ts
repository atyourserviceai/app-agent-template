import { useAgent } from "agents/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentMode, AppAgentState } from "../agent/AppAgent";

export function useAgentState(
  externalConfig: {
    agent: string;
    name: string;
    query?: Record<string, string>;
  } | null,
  initialMode: AgentMode = "onboarding"
) {
  const [agentState, setAgentState] = useState<AppAgentState | null>(null);
  const [agentMode, setAgentMode] = useState<AgentMode>(initialMode);

  // Add ref to track initial agent state load
  const initialStateLoaded = useRef(false);

  const [agentConfig] = useState(() => {
    console.log(`[UI] Using external agent config: ${externalConfig?.name || 'null'}`);
    return externalConfig;
  });

  // Update agent configuration with proper typing
  const changeAgentConfig = useCallback(
    (agent: string, newName: string | null) => {
      // Skip operation if newName is null
      if (!newName) return;

      console.log(`[UI] Changing agent config: ${agent} -> ${newName}`);
      // Implementation would go here - when needed
    },
    []
  );

  // Initialize the agent with authentication if available
  // Only call useAgent if we have a valid config to prevent WebSocket connections when not authenticated
  const agent = agentConfig ? useAgent({
    agent: agentConfig.agent,
    name: agentConfig.name,
    onStateUpdate: (newState: AppAgentState) => {
      console.log("[UI] Agent state updated:", newState);

      // Critical: On initial state load, force agentMode to match agent state
      if (!initialStateLoaded.current && newState?.mode) {
        console.log(
          `[UI] INITIAL STATE LOAD: Forcing mode to ${newState.mode} from agent state`
        );
        setAgentMode(newState.mode);
        initialStateLoaded.current = true;
      }

      setAgentState(newState);
    }, // Include query params for authentication
    query: agentConfig.query,
  }) : null;

  // Initialize agentMode from agent state when it changes
  useEffect(() => {
    if (agentState?.mode) {
      // Skip immediate sync if this is initial load (handled by onStateUpdate)
      if (initialStateLoaded.current && agentMode !== agentState.mode) {
        console.log(
          `[UI] Syncing UI mode state (${agentMode}) with agent state (${agentState.mode})`
        );
        setAgentMode(agentState.mode);
      } else if (agentState.mode !== agentMode) {
        console.log(
          `[UI] NOT syncing UI mode. Conditions: initialLoaded=${initialStateLoaded.current}, modesDiffer=${agentMode !== agentState.mode}`
        );
      }
    }
  }, [agentState, agentMode]);

  // Debug effect to detect state sync issues
  useEffect(() => {
    if (agentState && agentMode !== agentState.mode) {
      console.warn(
        `[UI] State sync issue detected: UI mode (${agentMode}) doesn't match agent state mode (${agentState.mode})`
      );
    }
  }, [agentState, agentMode]);

  // Function to change the agent mode
  const changeAgentMode = async (
    newMode: AgentMode,
    force = false,
    isAfterClearHistory = false
  ) => {
    try {
      // Don't change if already in this mode and not forcing and not after clearing history
      if (agentMode === newMode && !force && !isAfterClearHistory) {
        console.log(`Already in ${newMode} mode`);
        return;
      }

      // Show some UI feedback that we're changing modes
      let actionDescription = "Changing to";
      if (force) actionDescription = "Force re-setting";
      if (isAfterClearHistory)
        actionDescription = "Restoring after history clear";
      if (agentMode === newMode) actionDescription = "Refreshing";

      console.log(`${actionDescription} ${newMode} mode...`);

      // Update local state first to prevent UI flicker
      setAgentMode(newMode);

      // Instead of directly updating state, call the agent's setMode method
      // which will properly inject transition messages
      if (agent && agentConfig?.agent && agentConfig?.name) {
        // Log the endpoint URL we're actually using
        const setModeUrl = `/agents/${agentConfig.agent}/${agentConfig.name}/set-mode`;
        console.log(
          `[UI] Calling agent's setMode method to ${actionDescription.toLowerCase()} ${agentMode} to ${newMode}`
        );
        console.log(`[UI] Using endpoint URL: ${setModeUrl}`);

        // Extended debugging
        const fullUrl = new URL(setModeUrl, window.location.origin);
        console.log(`[UI] Full absolute URL: ${fullUrl.toString()}`);

        const urlObj = new URL(setModeUrl, window.location.origin);
        if (agentConfig.query) {
          for (const [k, v] of Object.entries(agentConfig.query)) {
            if (typeof v === "string") urlObj.searchParams.set(k, v);
          }
        }

        const response = await fetch(urlObj.toString(), {
          body: JSON.stringify({
            force,
            isAfterClearHistory,
            mode: newMode,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          credentials: "include",
        });

        console.log(
          `[UI] Set mode request status: ${response.status} ${response.statusText}`
        );

        if (!response.ok) {
          throw new Error(`Failed to change mode: ${response.statusText}`);
        }

        // Try to parse the response to see what the server is saying
        try {
          const responseData = (await response.clone().json()) as {
            success?: boolean;
            error?: string;
          };
          console.log("[UI] Set mode response:", responseData);

          if (responseData.error) {
            throw new Error(responseData.error);
          }

          // Force sync the UI when setMode API is used successfully
          if (responseData.success && agentMode !== newMode) {
            console.log(
              `[UI] Force updating UI mode to ${newMode} after successful setMode API call`
            );
            setAgentMode(newMode);
          }
        } catch (_e) {
          console.log("[UI] Unable to parse response as JSON");
        }

        console.log("[UI] Successfully called setMode endpoint with no error");
        return;
      }

      // If agent is not available, show an error
      console.error("[UI] Unable to change mode: agent not available or missing config");
    } catch (error) {
      console.error("Error changing agent mode:", error);
    }
  };

  // Function to navigate to a specific room
  const navigateToRoom = (roomName: string) => {
    if (agentConfig) {
      changeAgentConfig(agentConfig.agent, roomName);
    }
  };

  return {
    agent,
    agentConfig,
    agentMode,
    agentState,
    changeAgentConfig,
    changeAgentMode,
    navigateToRoom,
  };
}
