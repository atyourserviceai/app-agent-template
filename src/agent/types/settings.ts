/**
 * Type definitions for agent settings.
 */

import type { AdminContact, Operator } from "./company-config";

/**
 * Settings configuration for the agent.
 */
export interface AgentSettings {
  language: string;
  operators: Operator[];
  adminContact: AdminContact;
  currentUser?: string;
}
