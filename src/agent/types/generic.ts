/**
 * Generic type definitions for agent entities.
 */

/**
 * Generic entity that can represent any data object.
 */
export interface GenericEntity {
  id: string;
  name: string;
  type: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Processing history for entity interactions and status changes.
 */
export interface ProcessingHistory {
  id: string;
  entityId: string;
  timestamp: string;
  action: string;
  result: string;
  notes?: string;
}

/**
 * Task entity representing an action that needs to be performed.
 */
export interface Task {
  id: string;
  entityId?: string;
  description: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Interaction record for communications or actions.
 */
export interface Interaction {
  id: string;
  entityId?: string;
  timestamp: string;
  type: string;
  channel: string;
  content: string;
  outcome?: string;
  notes?: string;
}

/**
 * Operator (user) information
 */
export interface Operator {
  name: string;
  role: string;
  email?: string;
}

/**
 * Admin contact information
 */
export interface AdminContact {
  name: string;
  email?: string;
}

/**
 * Test result for agent functionality testing
 */
export interface TestResult {
  id: string;
  toolName: string;
  status: "pending" | "passed" | "failed" | "skipped";
  startTime: string;
  endTime?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  notes?: string;
}

/**
 * Tool documentation for testing mode
 */
export interface ToolDocumentation {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  examples?: unknown[];
  lastTested?: string;
  status?: "working" | "issues" | "unknown";
}

/**
 * Test report summary
 */
export interface TestReport {
  id: string;
  generatedAt: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  recommendations?: string[];
  issues?: string[];
}

/**
 * Transition recommendation for mode changes
 */
export interface TransitionRecommendation {
  fromMode: string;
  toMode: string;
  reason: string;
  confidence: number;
  requirements?: string[];
  warnings?: string[];
}

/**
 * Utility type for typed records
 */
export type TypedRecord<K extends string | number | symbol, T> = Record<K, T>;
