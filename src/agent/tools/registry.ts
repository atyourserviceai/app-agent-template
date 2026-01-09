/**
 * Centralized Tool Registry
 *
 * This is the ONLY place where tools should be imported from.
 * All tools are wrapped with error handling here to ensure consistent behavior.
 */

import { tool } from "ai";
import { z } from "zod/v3";
// Import raw, unwrapped tools from their source modules
import * as rawBallTools from "./balls";
import * as rawBrowserTools from "./browser";
import * as rawBrowserbaseTools from "./browserbase";
import { getGmailTools as getRawGmailTools } from "./composio";
import * as rawContextTools from "./context";
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
  execute: async ({ message }: { message: string }): Promise<string> => {
    console.log("[testErrorTool] About to throw error with message:", message);
    throw new Error(`Test error: ${message}`);
  },
  inputSchema: z.object({
    message: z.string().describe("Any message to echo back")
  })
});

// Wrap all tools with error handling
export const ballTools = wrapAllToolsWithErrorHandling(
  rawBallTools as unknown as ToolCollection
);
export const browserTools = wrapAllToolsWithErrorHandling(
  rawBrowserTools as unknown as ToolCollection
);
export const browserbaseTools = wrapAllToolsWithErrorHandling(
  rawBrowserbaseTools as unknown as ToolCollection
);
export const contextTools = wrapAllToolsWithErrorHandling(
  rawContextTools as unknown as ToolCollection
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
  balls: countTools(ballTools),
  browser: countTools(browserTools),
  browserbase: countTools(browserbaseTools),
  context: countTools(contextTools),
  scheduling: countTools(schedulingTools),
  search: countTools(searchTools),
  simpleFetch: countTools(simpleFetchTools),
  special: 1, // testErrorTool
  state: countTools(stateTools)
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
  // Ball simulation tools
  addBall: ballTools.addBall,
  addMultipleBalls: ballTools.addMultipleBalls,
  clearBalls: ballTools.clearBalls,
  getBallState: ballTools.getBallState,
  removeBall: ballTools.removeBall,
  setGravity: ballTools.setGravity,
  toggleSimulation: ballTools.toggleSimulation,

  // Browser tools
  browseWebPage: browserTools.browseWebPage,
  browseWithBrowserbase: browserbaseTools.browseWithBrowserbase,
  fetchWebPage: simpleFetchTools.fetchWebPage,

  // Scheduling tools
  cancelScheduledTask: schedulingTools.cancelScheduledTask,
  getScheduledTasks: schedulingTools.getScheduledTasks,
  scheduleTask: schedulingTools.scheduleTask,

  // State access tools
  getAgentState: stateTools.getAgentState,
  setMode: stateTools.setMode,

  // Context tools
  getLocalTime: contextTools.getLocalTime,
  getWeatherInformation: contextTools.getWeatherInformation,

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
  inputSchema: z.ZodType<TParams>;
  execute: (
    args: TParams,
    options?: { signal?: AbortSignal }
  ) => Promise<TResult>;
  experimental_toToolResultContent?: (result: TResult) => unknown;
};
