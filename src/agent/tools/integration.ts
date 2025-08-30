import { getCurrentAgent } from "agents";
import { generateId, tool } from "ai";
import { z } from 'zod/v3';
import type { AppAgent, AppAgentState } from "../AppAgent";

/**
 * Generic integration tools for testing and documenting integrations
 */

/**
 * Tool for recording test results during integration testing
 */
export const recordTestResult = tool({
  description: "Record the result of testing a tool or integration",
  execute: async ({ toolName, status, input, output, error, notes }) => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      const currentState = agent.state as AppAgentState;
      const testResults = currentState.testResults || {};

      const testResult = {
        endTime: new Date().toISOString(),
        error,
        id: generateId(),
        input,
        notes,
        output,
        startTime: new Date().toISOString(),
        status,
        success: status === "passed",
        toolName
      };

      await agent.setState({
        ...currentState,
        testResults: {
          ...testResults,
          [toolName]: testResult
        }
      });

      return `Test result recorded for ${toolName}: ${status}`;
    } catch (error) {
      console.error("Error recording test result:", error);
      return `Error recording test result: ${error}`;
    }
  },
  inputSchema: z.object({
    error: z.string().optional().describe("Error message if the test failed"),
    input: z.unknown().optional().describe("Input provided to the tool"),
    notes: z.string().optional().describe("Additional notes about the test"),
    output: z.unknown().optional().describe("Output received from the tool"),
    status: z.enum(["passed", "failed", "skipped"]).describe("Test result"),
    toolName: z.string().describe("Name of the tool that was tested")
  })
});

/**
 * Tool for documenting tools and their usage
 */
export const documentTool = tool({
  description: "Document a tool's purpose, parameters, and usage examples",
  execute: async ({ toolName, description, parameters, examples, status }) => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      const currentState = agent.state as AppAgentState;
      const toolDocumentation = currentState.toolDocumentation || {};

      const documentation = {
        description,
        examples,
        lastTested: new Date().toISOString(),
        name: toolName,
        inputSchema,
        status: status || "unknown"
      };

      await agent.setState({
        ...currentState,
        toolDocumentation: {
          ...toolDocumentation,
          [toolName]: documentation
        }
      });

      return `Documentation updated for ${toolName}`;
    } catch (error) {
      console.error("Error documenting tool:", error);
      return `Error documenting tool: ${error}`;
    }
  },
  inputSchema: z.object({
    description: z.string().describe("Description of what the tool does"),
    examples: z.array(z.string()).optional().describe("Usage examples"),
    inputSchema: z.record(z.unknown()).describe("Tool parameters schema"),
    status: z
      .enum(["working", "issues", "unknown"])
      .optional()
      .describe("Current status of the tool"),
    toolName: z.string().describe("Name of the tool to document")
  })
});

/**
 * Tool for generating a test report summarizing integration testing
 */
export const generateTestReport = tool({
  description: "Generate a comprehensive test report for all tested tools",
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      const currentState = agent.state as AppAgentState;
      const testResults = currentState.testResults || {};
      const toolDocumentation = currentState.toolDocumentation || {};

      const totalTests = Object.keys(testResults).length;
      const passedTests = Object.values(testResults).filter(
        (result) =>
          result &&
          typeof result === "object" &&
          "success" in result &&
          result.success
      ).length;
      const failedTests = Object.values(testResults).filter(
        (result) =>
          result &&
          typeof result === "object" &&
          "success" in result &&
          !result.success
      ).length;
      const documentedTools = Object.keys(toolDocumentation).length;

      const recommendations = [];
      const issues = [];

      // Generate recommendations based on test results
      if (failedTests > 0) {
        issues.push(`${failedTests} tests failed and need attention`);
        recommendations.push("Review and fix failed tests before proceeding");
      }

      if (documentedTools < totalTests) {
        recommendations.push("Document remaining tools for better maintenance");
      }

      if (passedTests === totalTests && totalTests > 0) {
        recommendations.push("All tests passing - ready for deployment");
      }

      const testReport = {
        documentedTools,
        failedTests,
        generatedAt: new Date().toISOString(),
        id: generateId(),
        issues,
        passedTests,
        recommendations,
        skippedTests: totalTests - passedTests - failedTests,
        totalTests
      };

      await agent.setState({
        ...currentState,
        testReport
      });

      return {
        message: `Test report generated: ${passedTests}/${totalTests} tests passed`,
        report: testReport,
        success: true
      };
    } catch (error) {
      console.error("Error generating test report:", error);
      return `Error generating test report: ${error}`;
    }
  },
  inputSchema: z.object({})
});

/**
 * Tool for completing the integration testing phase
 */
export const completeIntegrationTesting = tool({
  description: "Mark the integration testing phase as complete",
  execute: async ({ force = false }) => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      const currentState = agent.state as AppAgentState;
      const testResults = currentState.testResults || {};

      // Check if we have valid test results
      const totalTests = Object.keys(testResults).length;
      const passedTests = Object.values(testResults).filter(
        (result) =>
          result &&
          typeof result === "object" &&
          "success" in result &&
          result.success
      ).length;

      if (totalTests === 0 && !force) {
        return "Cannot complete integration testing: No tests have been run. Use force=true to override.";
      }

      if (passedTests < totalTests && !force) {
        return `Cannot complete integration testing: ${totalTests - passedTests} tests failed. Fix issues or use force=true to override.`;
      }

      await agent.setState({
        ...currentState,
        isIntegrationComplete: true
      });

      return "Integration testing phase completed successfully!";
    } catch (error) {
      console.error("Error completing integration testing:", error);
      return `Error completing integration testing: ${error}`;
    }
  },
  inputSchema: z.object({
    force: z
      .boolean()
      .optional()
      .describe("Force completion even if tests failed")
  })
});

/**
 * Tool for testing error handling (controlled error for testing purposes)
 */
export const testErrorTool = tool({
  description: "Generate a controlled error for testing error handling",
  execute: async ({ errorType, message }) => {
    console.log(`[TEST] Generating ${errorType} error: ${message}`);

    switch (errorType) {
      case "timeout":
        throw new Error(`Timeout error: ${message}`);
      case "network":
        throw new Error(`Network error: ${message}`);
      default:
        throw new Error(`Test error: ${message}`);
    }
  },
  inputSchema: z.object({
    errorType: z
      .enum(["simple", "timeout", "network"])
      .optional()
      .default("simple"),
    message: z.string().optional().default("Test error message")
  })
});
