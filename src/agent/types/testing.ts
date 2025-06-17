/**
 * Type definitions for testing features.
 */
import type { AgentMode } from "../AppAgent";

/**
 * Result of a test execution.
 */
export interface TestResult {
  id: string;
  success: boolean;
  timestamp: string;
  error: string | null;
  notes: string | null;
}

/**
 * Documentation for a tool.
 */
export interface ToolDocumentation {
  id: string;
  purpose: string;
  usage: string;
  parameters: Array<{ name: string; description: string }>;
  examples: string[];
  documentedAt: string;
}

/**
 * Information about a failed test.
 */
export interface FailedTest {
  tool: string;
  error: string;
  recommendations: string[];
}

/**
 * Comprehensive test report.
 */
export interface TestReport {
  summary: {
    completedAt: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    documentedTools: number;
    allPassed: boolean;
    readyForCrmMode: boolean;
  };
  failedTests: FailedTest[];
  recommendations: string[];
  documentation: string | null;
}

/**
 * Recommendation for transitioning to next agent mode.
 */
export interface TransitionRecommendation {
  nextStep: AgentMode;
  message: string;
  comments?: string;
}

/**
 * Complete testing state.
 */
export interface TestingState {
  testResults: Record<string, TestResult>;
  toolDocumentation: Record<string, ToolDocumentation>;
  testReport?: TestReport;
  crmToolDocumentation?: string;
  isTestingComplete: boolean;
  transitionRecommendation?: TransitionRecommendation;
}
