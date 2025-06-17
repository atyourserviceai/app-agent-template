/**
 * Type definitions for agent settings.
 */

import type { Operator, AdminContact } from "./company-config";

/**
 * Settings configuration for the agent.
 */
export interface AgentSettings {
  language: string;
  operators: Operator[];
  adminContact: AdminContact;
  currentUser?: string;
}
