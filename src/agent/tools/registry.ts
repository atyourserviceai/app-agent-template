/**
 * Centralized Tool Registry
 *
 * This is the ONLY place where tools should be imported from.
 * All tools are wrapped with error handling here to ensure consistent behavior.
 */

import { tool } from "ai";
import { z } from 'zod/v3';
// Import raw, unwrapped tools from their source modules
import * as rawBrowserTools from "./browser";
import * as rawBrowserbaseTools from "./browserbase";
import { getGmailTools as getRawGmailTools } from "./composio";
import * as rawContextTools from "./context";
import * as rawIntegrationTools from "./integration";
import * as rawMessagingTools from "./messaging";
import { suggestActions as rawSuggestActions } from "./messaging";
import * as rawOnboardingTools from "./onboarding";
import * as rawSchedulingTools from "./scheduling";
import * as rawSearchTools from "./search";
import * as rawSimpleFetchTools from "./simpleFetch";
import * as rawStateTools from "./state";

// Import the wrapper function
import {
  wrapAllToolsWithErrorHandling,
  wrapToolWithErrorHandling
} from "./wrappers";

// Define a type for a collection of tools
type ToolCollection<T = unknown, R = unknown> = Record<string, Tool<T, R>>;

/**
 * Custom test error tool for demonstrating error handling
 */
const rawTestErrorTool = tool({
  description: "Debug tool that always fails to show error formatting",
  execute: async ({ message }: { message: string }) => {
    console.log("[testErrorTool] About to throw error with message:", message);
    throw new Error(`Test error: ${message}`);
  },
  inputSchema: z.object({
    message: z.string().describe("Any message to echo back")
  })
});

// Wrap all tools with error handling
export const browserTools = wrapAllToolsWithErrorHandling(
  rawBrowserTools as unknown as ToolCollection
);
export const browserbaseTools = wrapAllToolsWithErrorHandling(
  rawBrowserbaseTools as unknown as ToolCollection
);
export const contextTools = wrapAllToolsWithErrorHandling(
  rawContextTools as unknown as ToolCollection
);
export const integrationTools = wrapAllToolsWithErrorHandling(
  rawIntegrationTools as unknown as ToolCollection
);
export const messagingTools = wrapAllToolsWithErrorHandling(
  rawMessagingTools as unknown as ToolCollection
);
export const suggestActions = wrapToolWithErrorHandling(
  rawSuggestActions as unknown as Tool
);
export const onboardingTools = wrapAllToolsWithErrorHandling(
  rawOnboardingTools as unknown as ToolCollection
);
export const schedulingTools = wrapAllToolsWithErrorHandling(
  rawSchedulingTools as unknown as ToolCollection
);
export const searchTools = wrapAllToolsWithErrorHandling(
  rawSearchTools.searchTools as unknown as ToolCollection
);
export const runResearch = wrapToolWithErrorHandling(
  rawSearchTools.runResearch as unknown as Tool
);
export const simpleFetchTools = wrapAllToolsWithErrorHandling(
  rawSimpleFetchTools as unknown as ToolCollection
);
export const stateTools = wrapAllToolsWithErrorHandling(
  rawStateTools as unknown as ToolCollection
);
export const testErrorTool = wrapToolWithErrorHandling(
  rawTestErrorTool as unknown as Tool
);

// Log that all tools are wrapped with error handling
console.log("[registry] All tools have been wrapped with error handling");

// Count the number of tools wrapped
const countTools = (obj: ToolCollection): number => {
  if (!obj || typeof obj !== "object") return 0;
  return Object.keys(obj).filter((key) => {
    const tool = obj[key];
    return (
      tool && typeof tool === "object" && typeof tool.execute === "function"
    );
  }).length;
};

// Count total executable tools
const toolCounts = {
  browser: countTools(browserTools),
  browserbase: countTools(browserbaseTools),
  context: countTools(contextTools),
  integration: countTools(integrationTools),
  messaging: countTools(messagingTools),
  onboarding: countTools(onboardingTools),
  scheduling: countTools(schedulingTools),
  search: countTools(searchTools),
  simpleFetch: countTools(simpleFetchTools),
  special: 2,
  state: countTools(stateTools) // testErrorTool and suggestActions
};

const totalTools = Object.values(toolCounts).reduce(
  (sum, count) => sum + count,
  0
);

console.log(
  `[registry] Total tool categories: ${Object.keys(toolCounts).length}`
);
console.log(`[registry] Total executable tools: ${totalTools}`);
console.log(
  `[registry] Tool counts by category: ${JSON.stringify(toolCounts)}`
);

/**
 * Export all tools in a single map object
 * This is useful for tools that need them all in a single object
 */
export const tools = {
  // Browser tools
  browseWebPage: browserTools.browseWebPage,
  browseWithBrowserbase: browserbaseTools.browseWithBrowserbase,
  cancelScheduledTask: schedulingTools.cancelScheduledTask,
  checkExistingConfig: onboardingTools.checkExistingConfig,
  completeIntegrationTesting: integrationTools.completeIntegrationTesting,
  completeOnboarding: onboardingTools.completeOnboarding,
  documentTool: integrationTools.documentTool,
  fetchWebPage: simpleFetchTools.fetchWebPage,
  generateTestReport: integrationTools.generateTestReport,

  // State access tools
  getAgentState: stateTools.getAgentState,
  getLocalTime: contextTools.getLocalTime,
  getOnboardingStatus: onboardingTools.getOnboardingStatus,
  getScheduledTasks: schedulingTools.getScheduledTasks,
  // Context tools
  getWeatherInformation: contextTools.getWeatherInformation,

  // Integration tools
  recordTestResult: integrationTools.recordTestResult,

  // Onboarding tools
  saveSettings: onboardingTools.saveSettings,

  // Scheduling tools
  scheduleTask: schedulingTools.scheduleTask,
  setMode: stateTools.setMode,

  // Messaging tools
  ...messagingTools,
  suggestActions,

  // Search tools
  ...searchTools,
  runResearch,

  // Test error tool
  testErrorTool
};

/**
 * Implementation of confirmation-required tools
 * This object contains the actual logic for tools that need human approval
 */
export const executions = {
  // Add executions for tools that require human approval
  // For now, all tools have built-in execute functions
};

// Export Gmail tools as a function that can be called when needed
export const getGmailTools = async () => {
  const gmailTools = await getRawGmailTools();
  return wrapAllToolsWithErrorHandling(gmailTools as unknown as ToolCollection);
};

// Define a generic Tool type that matches the actual tool implementations
export type Tool<TParams = unknown, TResult = unknown> = {
  description: string;
  parameters: z.ZodType<TParams>;
  execute: (
    args: TParams,
    options?: { signal?: AbortSignal }
  ) => Promise<TResult>;
  experimental_toToolResultContent?: (result: TResult) => unknown;
};
