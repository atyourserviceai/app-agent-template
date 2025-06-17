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
  // Context tools
  getWeatherInformation: contextTools.getWeatherInformation,
  getLocalTime: contextTools.getLocalTime,
  browseWebPage: browserTools.browseWebPage,
  browseWithBrowserbase: browserbaseTools.browseWithBrowserbase,
  fetchWebPage: simpleFetchTools.fetchWebPage,

  // Scheduling tools
  scheduleTask: schedulingTools.scheduleTask,
  getScheduledTasks: schedulingTools.getScheduledTasks,
  cancelScheduledTask: schedulingTools.cancelScheduledTask,

  // Onboarding tools
  saveSettings: onboardingTools.saveSettings,
  completeOnboarding: onboardingTools.completeOnboarding,
  checkExistingConfig: onboardingTools.checkExistingConfig,
  getOnboardingStatus: onboardingTools.getOnboardingStatus,

  // Integration tools
  recordTestResult: integrationTools.recordTestResult,
  documentTool: integrationTools.documentTool,
  generateTestReport: integrationTools.generateTestReport,
  completeIntegrationTesting: integrationTools.completeIntegrationTesting,
  testErrorTool: integrationTools.testErrorTool,

  // State access tools
  getAgentState: stateTools.getAgentState,
  setMode: stateTools.setMode,

  // Messaging tools
  suggestActions: messagingTools.suggestActions,

  // Search tools
  runResearch: searchTools.runResearch,
};

/**
 * Implementation of confirmation-required tools
 * This object contains the actual logic for tools that need human approval
 */
export const executions = {
  // Add executions for tools that require human approval
  // For now, all tools have built-in execute functions
};

// Re-export all individual tools directly as well
export * from "./scheduling";
export * from "./context";
export * from "./onboarding";
export * from "./integration";
export * from "./browser";
export * from "./browserbase";
export * from "./simpleFetch";
export * from "./messaging";
export * from "./search";
export * from "./state";
