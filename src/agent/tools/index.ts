/**
 * Tools registry for the agent system
 * This file imports and re-exports all tools from specialized directories
 */

import * as browserTools from "./browser";
import * as browserbaseTools from "./browserbase";
// Import all tools from specialized directories
import * as contextTools from "./context";
import * as integrationTools from "./integration";
import * as messagingTools from "./messaging";
import * as onboardingTools from "./onboarding";
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

  // Search tools
  runResearch: searchTools.runResearch,

  // Onboarding tools
  saveSettings: onboardingTools.saveSettings,

  // Scheduling tools
  scheduleTask: schedulingTools.scheduleTask,
  setMode: stateTools.setMode,

  // Messaging tools
  suggestActions: messagingTools.suggestActions,
  testErrorTool: integrationTools.testErrorTool,
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
export * from "./integration";
export * from "./messaging";
export * from "./onboarding";
// Re-export all individual tools directly as well
export * from "./scheduling";
export * from "./search";
export * from "./simpleFetch";
export * from "./state";
