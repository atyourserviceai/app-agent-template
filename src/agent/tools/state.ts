import { getCurrentAgent } from "agents";
import { tool } from "ai";
import { z } from "zod/v3";
import type { AgentMode, AppAgent, AppAgentState } from "../AppAgent";

/**
 * Gets the current agent state relevant to the active mode
 */
export const getAgentState = tool({
  description:
    "Get the current agent state including mode and general settings",
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      // Get current state
      const currentState = agent.state as AppAgentState;

      // Return only the relevant fields to avoid large payloads
      return {
        mode: currentState.mode,
        settings: currentState.settings || {}
      };
    } catch (error) {
      console.error("Error getting agent state:", error);
      return `Error getting agent state: ${error}`;
    }
  },
  inputSchema: z.object({})
});

/**
 * Gets the agent configuration and settings
 */
export const getAgentConfig = tool({
  description:
    "Get the agent configuration data including settings and preferences",
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      // Get current state
      const currentState = agent.state as AppAgentState;

      // Return only the configuration
      return {
        settings: currentState.settings || {}
      };
    } catch (error) {
      console.error("Error getting agent configuration:", error);
      return `Error getting agent configuration: ${error}`;
    }
  },
  inputSchema: z.object({})
});

/**
 * Gets the current mode and available transitions
 */
export const getModeInfo = tool({
  description:
    "Get information about the current mode and available mode transitions",
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      // Get current state
      const currentState = agent.state as AppAgentState;
      const currentMode = currentState.mode;

      // Define mode progression and available transitions
      const modeInfo = {
        availableTransitions: [] as string[],
        currentMode,
        modeDescriptions: {
          act: "Execute tasks and take concrete actions",
          plan: "Analyze tasks and create strategic plans"
        }
      };

      // Determine available transitions based on current mode
      switch (currentMode) {
        case "plan":
          modeInfo.availableTransitions.push("act");
          break;
        case "act":
          modeInfo.availableTransitions.push("plan");
          break;
      }

      return modeInfo;
    } catch (error) {
      console.error("Error getting mode info:", error);
      return `Error getting mode info: ${error}`;
    }
  },
  inputSchema: z.object({})
});

/**
 * Sets the agent's operating mode
 */
export const setMode = tool({
  description: "Set the agent's operating mode (plan or act)",
  execute: async ({
    mode,
    force = false
  }: {
    mode: AgentMode;
    force?: boolean;
  }) => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      const result = await agent.setMode(mode, force);
      return {
        currentMode: result.currentMode,
        message: `Successfully switched to ${mode} mode`,
        previousMode: result.previousMode,
        success: true
      };
    } catch (error) {
      console.error("Error setting mode:", error);
      return `Error setting mode: ${error}`;
    }
  },
  inputSchema: z.object({
    force: z
      .boolean()
      .describe("Force the mode change even if conditions are not met"),
    mode: z.enum(["plan", "act"]).describe("The mode to switch to")
  })
});
