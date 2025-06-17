import { getCurrentAgent } from "agents";
import { tool } from "ai";
import { z } from "zod";
import type { AppAgent, AppAgentState } from "../AppAgent";

/**
 * Generic onboarding tools for basic agent configuration
 */

/**
 * Tool for saving basic agent settings during onboarding
 */
export const saveSettings = tool({
  description: "Save basic agent settings during the onboarding process",
  parameters: z.object({
    language: z.string().optional().describe("Agent language preference"),
    operatorName: z
      .string()
      .optional()
      .describe("Name of the primary operator"),
    operatorEmail: z
      .string()
      .optional()
      .describe("Email of the primary operator"),
    adminContactName: z
      .string()
      .optional()
      .describe("Name of the admin contact"),
    adminContactEmail: z
      .string()
      .optional()
      .describe("Email of the admin contact"),
  }),
  execute: async ({
    language,
    operatorName,
    operatorEmail,
    adminContactName,
    adminContactEmail,
  }) => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      const currentState = agent.state as AppAgentState;
      const currentSettings = currentState.settings || {
        language: "en",
        operators: [],
        adminContact: { name: "", email: "" },
      };

      // Update settings with provided values
      const updatedSettings = {
        ...currentSettings,
        language: language || currentSettings.language,
        adminContact: {
          name: adminContactName || currentSettings.adminContact.name,
          email: adminContactEmail || currentSettings.adminContact.email,
        },
        operators: operatorName
          ? [
              {
                name: operatorName,
                role: "primary",
                email: operatorEmail,
              },
              ...currentSettings.operators.filter(
                (op) => op.role !== "primary"
              ),
            ]
          : currentSettings.operators,
      };

      await agent.setState({
        ...currentState,
        settings: updatedSettings,
      });

      return "Settings saved successfully.";
    } catch (error) {
      console.error("Error saving settings:", error);
      return `Error saving settings: ${error}`;
    }
  },
});

/**
 * Tool for completing the onboarding process
 */
export const completeOnboarding = tool({
  description: "Mark the onboarding process as complete",
  parameters: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      const currentState = agent.state as AppAgentState;

      await agent.setState({
        ...currentState,
        isOnboardingComplete: true,
      });

      return "Onboarding completed successfully! The agent is now ready for use.";
    } catch (error) {
      console.error("Error completing onboarding:", error);
      return `Error completing onboarding: ${error}`;
    }
  },
});

/**
 * Tool for checking onboarding status
 */
export const getOnboardingStatus = tool({
  description: "Get the current onboarding status and configuration",
  parameters: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      const currentState = agent.state as AppAgentState;
      const settings = currentState.settings;

      return {
        isComplete: currentState.isOnboardingComplete,
        settings: {
          language: settings?.language || "en",
          hasOperators: (settings?.operators?.length || 0) > 0,
          hasAdminContact: !!settings?.adminContact?.name,
        },
        message: currentState.isOnboardingComplete
          ? "Onboarding is complete"
          : "Onboarding is in progress",
      };
    } catch (error) {
      console.error("Error getting onboarding status:", error);
      return `Error getting onboarding status: ${error}`;
    }
  },
});

/**
 * Tool for checking existing configuration
 */
export const checkExistingConfig = tool({
  description: "Check if the agent has existing configuration",
  parameters: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      const currentState = agent.state as AppAgentState;
      const hasConfig =
        currentState.isOnboardingComplete && currentState.settings;

      return {
        hasExistingConfig: !!hasConfig,
        isOnboardingComplete: currentState.isOnboardingComplete,
        message: hasConfig
          ? "Agent has existing configuration"
          : "No existing configuration found",
      };
    } catch (error) {
      console.error("Error checking existing config:", error);
      return `Error checking existing config: ${error}`;
    }
  },
});
