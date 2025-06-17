import { getCurrentAgent } from "agents";
import { tool } from "ai";
import { z } from "zod";
import type { AgentMode, AppAgent, AppAgentState } from "../AppAgent";

/**
 * Gets the current agent state relevant to the active mode
 */
export const getAgentState = tool({
  description:
    "Get the current agent state including mode and general settings",
  parameters: z.object({}),
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
        settings: currentState.settings || {},
        isOnboardingComplete: currentState.isOnboardingComplete || false,
        isIntegrationComplete: currentState.isIntegrationComplete || false,
        onboardingStep: currentState.onboardingStep || "start",
      };
    } catch (error) {
      console.error("Error getting agent state:", error);
      return `Error getting agent state: ${error}`;
    }
  },
});

/**
 * Gets the agent configuration and settings
 */
export const getAgentConfig = tool({
  description:
    "Get the agent configuration data including settings and preferences",
  parameters: z.object({}),
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
        settings: currentState.settings || {},
        isOnboardingComplete: currentState.isOnboardingComplete || false,
        onboardingStep: currentState.onboardingStep || "start",
      };
    } catch (error) {
      console.error("Error getting agent configuration:", error);
      return `Error getting agent configuration: ${error}`;
    }
  },
});

/**
 * Gets the testing results and tool documentation for the integration mode
 */
export const getIntegrationState = tool({
  description:
    "Get the integration progress, results, and tool documentation for integration mode",
  parameters: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      // Get current state
      const currentState = agent.state as AppAgentState;

      // Calculate testing progress statistics
      const testResults = currentState.testResults || {};
      const toolDocumentation = currentState.toolDocumentation || {};

      const totalTests = Object.keys(testResults).length;
      const successCount = Object.values(testResults).filter(
        (result) =>
          result &&
          typeof result === "object" &&
          "success" in result &&
          result.success
      ).length;
      const failedTests = totalTests - successCount;
      const documentedTools = Object.keys(toolDocumentation).length;

      // Return testing state with progress summary
      return {
        progress: {
          totalTests,
          successCount,
          failedTests,
          documentedTools,
          completionPercentage:
            totalTests > 0
              ? Math.round(
                  (successCount / totalTests) * 50 +
                    (documentedTools / Math.max(totalTests, 1)) * 50
                )
              : 0,
          isComplete:
            (totalTests > 0 && currentState.isIntegrationComplete) || false,
        },
        testResults,
        toolDocumentation,
        testReport: currentState.testReport || null,
        transitionRecommendation: currentState.transitionRecommendation || null,
      };
    } catch (error) {
      console.error("Error getting integration state:", error);
      return `Error getting integration state: ${error}`;
    }
  },
});

/**
 * Gets the current mode and available transitions
 */
export const getModeInfo = tool({
  description:
    "Get information about the current mode and available mode transitions",
  parameters: z.object({}),
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
        currentMode,
        availableTransitions: [] as string[],
        modeDescriptions: {
          onboarding: "Configure agent settings and initial setup",
          integration: "Test tools and integrations before deployment",
          plan: "Analyze tasks and create strategic plans",
          act: "Execute tasks and take concrete actions",
        },
      };

      // Determine available transitions based on current mode
      // Allow flexible transitions between all modes for better UX
      switch (currentMode) {
        case "onboarding":
          modeInfo.availableTransitions.push("integration", "plan", "act");
          break;
        case "integration":
          modeInfo.availableTransitions.push("onboarding", "plan", "act");
          break;
        case "plan":
          modeInfo.availableTransitions.push(
            "onboarding",
            "integration",
            "act"
          );
          break;
        case "act":
          modeInfo.availableTransitions.push(
            "onboarding",
            "integration",
            "plan"
          );
          break;
      }

      return modeInfo;
    } catch (error) {
      console.error("Error getting mode info:", error);
      return `Error getting mode info: ${error}`;
    }
  },
});

/**
 * Sets the agent's operating mode
 */
export const setMode = tool({
  description:
    "Set the agent's operating mode (onboarding, integration, plan, act)",
  parameters: z.object({
    mode: z
      .enum(["onboarding", "integration", "plan", "act"])
      .describe("The mode to switch to"),
    force: z
      .boolean()
      .optional()
      .describe("Force the mode change even if conditions aren't met"),
  }),
  execute: async ({
    mode,
    force = false,
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
        success: true,
        message: `Successfully switched to ${mode} mode`,
        previousMode: result.previousMode,
        currentMode: result.currentMode,
      };
    } catch (error) {
      console.error("Error setting mode:", error);
      return `Error setting mode: ${error}`;
    }
  },
});
