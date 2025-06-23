import { useEffect, useCallback, useState, useRef } from "react";
import type { AgentMode, AppAgentState } from "../agent/AppAgent";
import { useAgent } from "agents/react";

export function useAgentState(
  initialMode: AgentMode = "onboarding",
  externalConfig?: {
    agent: string;
    name: string;
    query?: Record<string, string>;
  } | null
) {
  const [agentState, setAgentState] = useState<AppAgentState | null>(null);
  const [agentMode, setAgentMode] = useState<AgentMode>(initialMode);

  // Add ref to track initial agent state load
  const initialStateLoaded = useRef(false);

  // Move getNameFromURL to a useCallback to avoid dependency issues
  const getNameFromURL = useCallback(() => {
    // Extract name from URL
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("room");
  }, []);

  const [agentConfig] = useState(() => {
    if (externalConfig) {
      console.log(`[UI] Using external agent config: ${externalConfig.name}`);
      return externalConfig;
    }

    // Fallback to URL-based config for development
    const name = getNameFromURL() || "default-room";
    console.log(`[UI] Using URL-based agent config: ${name}`);
    return {
      agent: "app-agent",
      name,
    };
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

  // Listen for URL changes and update agent config when room param changes
  useEffect(() => {
    const handleURLChange = () => {
      const newName = getNameFromURL();
      if (newName !== agentConfig.name) {
        changeAgentConfig(agentConfig.agent, newName);
      }
    };

    window.addEventListener("popstate", handleURLChange);
    return () => {
      window.removeEventListener("popstate", handleURLChange);
    };
  }, [agentConfig.agent, agentConfig.name, changeAgentConfig, getNameFromURL]);

  // Initialize the agent with authentication if available
  const agent = useAgent({
    agent: agentConfig.agent,
    name: agentConfig.name,
    query: agentConfig.query, // Include query params for authentication
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
    },
  });

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
      if (agent) {
        // Log the endpoint URL we're actually using
        const setModeUrl = `/agents/${agentConfig.agent}/${agentConfig.name}/set-mode`;
        console.log(
          `[UI] Calling agent's setMode method to ${actionDescription.toLowerCase()} ${agentMode} to ${newMode}`
        );
        console.log(`[UI] Using endpoint URL: ${setModeUrl}`);

        // Extended debugging
        const fullUrl = new URL(setModeUrl, window.location.origin);
        console.log(`[UI] Full absolute URL: ${fullUrl.toString()}`);

        const response = await fetch(setModeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: newMode,
            force,
            isAfterClearHistory,
          }),
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
          };
          console.log("[UI] Set mode response:", responseData);

          // Force sync the UI when setMode API is used successfully
          if (responseData.success && agentMode !== newMode) {
            console.log(
              `[UI] Force updating UI mode to ${newMode} after successful setMode API call`
            );
            setAgentMode(newMode);
          }
        } catch (e) {
          console.log("[UI] Unable to parse response as JSON");
        }

        console.log("[UI] Successfully called setMode endpoint");
        return;
      }

      // If agent is not available, show an error
      console.error("[UI] Unable to change mode: agent not available");
    } catch (error) {
      console.error("Error changing agent mode:", error);
    }
  };

  // Function to navigate to a specific room
  const navigateToRoom = (roomName: string) => {
    changeAgentConfig(agentConfig.agent, roomName);
  };

  return {
    agent,
    agentState,
    agentMode,
    agentConfig,
    changeAgentConfig,
    changeAgentMode,
    navigateToRoom,
  };
}
