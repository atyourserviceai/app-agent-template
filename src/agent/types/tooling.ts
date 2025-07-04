/**
 * Type definitions for agent tooling.
 */

import type {
  AgentAction,
  DesiredAutomation,
  ExistingTool,
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
