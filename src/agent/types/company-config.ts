/**
 * Type definitions for company configuration and related entities.
 */

/**
 * Represents a stage in the sales funnel.
 */
export interface FunnelStage {
  id: string;
  name: string;
  description: string;
  criteria?: string[];
  nextSteps?: string[];
  typicalDuration?: string;
}

/**
 * Criteria for qualifying leads.
 */
export interface QualificationCriteria {
  name: string;
  description: string;
  importance: "low" | "medium" | "high";
}

/**
 * Objection and corresponding response for handling sales objections.
 */
export interface ObjectionResponse {
  objection: string;
  response: string;
}

/**
 * Communication template for various stages of the sales process.
 */
export interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  channel: string;
  stageId: string;
}

/**
 * Existing tool or software used in the sales process.
 */
export interface ExistingTool {
  name: string;
  purpose: string;
  effectiveness: string;
  notes?: string;
}

/**
 * Automation desired in the sales process.
 */
export interface DesiredAutomation {
  description: string;
  priority: "low" | "medium" | "high";
  impactArea: string;
  notes?: string;
}

/**
 * Action that the agent should perform.
 */
export interface AgentAction {
  name: string;
  description: string;
  trigger: string;
  priority: "low" | "medium" | "high";
  notes?: string;
}

/**
 * Research method for gathering information.
 */
export interface ResearchMethod {
  name: string;
  purpose: string;
  details: string;
  notes?: string;
}

/**
 * Preference for a communication channel.
 */
export interface CommunicationPreference {
  channel: string;
  priority: number;
  conditions?: string;
  bestPractices?: string;
  frequency?: string;
  description?: string;
}

/**
 * Operator who uses the system.
 */
export interface Operator {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  preferences?: Record<string, string | number | boolean>;
}

/**
 * Admin contact information.
 */
export interface AdminContact {
  name: string;
  email: string;
  phone?: string;
}

/**
 * Communication channels configuration.
 */
export interface CommunicationChannels {
  preferences: CommunicationPreference[];
  rules?: string;
}

/**
 * Tooling configuration for the company.
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

/**
 * External system to integrate with
 */
export interface IntegrationSystem {
  type: string;
  name: string;
  description: string;
  authRequirements?: string;
  apiEndpoints?: string[];
}

/**
 * Data synchronization requirements
 */
export interface DataRequirements {
  importNeeds: string;
  exportNeeds: string;
  syncFrequency?: string;
}

/**
 * Integration configuration for external systems
 */
export interface Integrations {
  systems: IntegrationSystem[];
  dataRequirements: DataRequirements;
  additionalNotes?: string;
}

/**
 * Complete company configuration.
 */
export interface CompanyConfig {
  id: string;
  name: string;
  description: string;
  website: string;
  industry?: string;
  productDescription?: string;
  targetCustomerProfile?: string;
  funnelStages?: FunnelStage[];
  qualificationCriteria?: QualificationCriteria[];
  objectionResponses?: ObjectionResponse[];
  templates?: Template[];
  tooling?: Tooling;
  communicationChannels?: CommunicationChannels;
  integrations?: Integrations;
  playbook?: string;
}
