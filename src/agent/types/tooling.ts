/**
 * Type definitions for agent tooling.
 */

import type {
  ExistingTool,
  DesiredAutomation,
  AgentAction,
  ResearchMethod,
} from "./company-config";

/**
 * Tooling configuration for the agent.
 */
export interface Tooling {
  currentProcesses: string;
  painPoints: string;
  existingTools: ExistingTool[];
  desiredAutomations: DesiredAutomation[];
  agentActions: AgentAction[];
  researchMethods: ResearchMethod[];
  implementationPlan?: string;
}
