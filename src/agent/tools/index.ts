/**
 * Tools registry for the agent system
 * This file imports and re-exports all tools from specialized directories
 */

import * as browserTools from "./browser";
import * as browserbaseTools from "./browserbase";
// Import all tools from specialized directories
import * as contextTools from "./context";
import * as schedulingTools from "./scheduling";
import * as searchTools from "./search";
import * as simpleFetchTools from "./simpleFetch";
import * as stateTools from "./state";

/**
 * Export all available tools
 * These will be provided to the AI model to describe available capabilities
 */
export const tools = {
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
  runResearch: searchTools.runResearch
};

/**
 * Implementation of confirmation-required tools
 * This object contains the actual logic for tools that need human approval
 */
export const executions = {
  // Add executions for tools that require human approval
  // For now, all tools have built-in execute functions
};

export * from "./browser";
export * from "./browserbase";
export * from "./context";
// Re-export all individual tools directly as well
export * from "./scheduling";
export * from "./search";
export * from "./simpleFetch";
export * from "./state";
