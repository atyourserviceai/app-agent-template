import type { Tool } from "./registry";

/**
 * # Tool Error Handling Strategy
 *
 * When a tool throws an exception, it disrupts the AI's ability to continue the conversation
 * in a helpful way, and the UI experience is poor because the entire assistant message
 * is replaced with a generic error.
 *
 * This module provides wrapper functions that:
 * 1. Catch exceptions thrown by tools
 * 2. Transform them into structured error objects that are returned as regular results
 * 3. Allow the UI to display the error information in a user-friendly way
 *
 * The error objects include:
 * - A success: false flag to indicate failure
 * - An error object with message, details, and timestamp
 *
 * This approach ensures that:
 * - Tool errors are properly persisted in the conversation history
 * - The context of the assistant's message is preserved
 * - Users get detailed information about what went wrong
 * - The system remains stable even when tools fail
 */

/**
 * Standard error result format for tools
 */
export interface ToolErrorResult {
  success: false;
  error: {
    message: string;
    details?: string;
    timestamp: string;
  };
}

/**
 * Standard success result format for tools
 */
export interface ToolSuccessResult<T = unknown> {
  success: true;
  result: T;
}

/**
 * Combined result type
 */
export type ToolResult<T = unknown> = ToolSuccessResult<T> | ToolErrorResult;

/**
 * Wraps a tool with error handling to ensure errors are returned as results
 * instead of being thrown as exceptions
 *
 * @param tool The original tool
 * @returns A new tool with error handling
 */
export function wrapToolWithErrorHandling<TParams, TResult>(
  tool: Tool<TParams, TResult>
): Tool<TParams, TResult> {
  const originalExecute = tool.execute;

  if (!originalExecute) {
    if (tool.description) {
      console.debug(
        `[Tool Wrapper] Skipping wrapper for non-executable tool: ${tool.description}`
      );
    }
    return tool;
  }

  const wrappedExecute = async (
    params: TParams,
    options?: { signal?: AbortSignal }
  ) => {
    try {
      const result = await originalExecute(params, options);
      if (result && typeof result === "object" && "success" in result) {
        return result as TResult;
      }
      return {
        result,
        success: true,
      } as TResult;
    } catch (error) {
      console.error(
        `[Tool Error] ${tool.description || "unnamed tool"} failed:`,
        error
      );
      return {
        error: {
          details: error instanceof Error ? error.stack : undefined,
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
        success: false,
      } as TResult;
    }
  };

  return {
    ...tool,
    execute: wrappedExecute,
  };
}

/**
 * Wraps all tools in a record with error handling.
 */
export function wrapAllToolsWithErrorHandling<
  T extends Record<string, Tool<unknown, unknown>>,
>(tools: T): T {
  const wrappedTools: Partial<T> = {};
  for (const [name, tool] of Object.entries(tools)) {
    wrappedTools[name as keyof T] = wrapToolWithErrorHandling(
      tool as Tool<unknown, unknown>
    ) as T[keyof T];
  }
  return wrappedTools as T;
}

/**
 * Helper function to create a standardized error result
 * Useful for manually creating error results in tool implementations
 * without throwing exceptions
 *
 * @param message Error message
 * @param details Optional error details
 * @returns A formatted error result object
 */
export function createToolErrorResult(
  message: string,
  details?: string
): ToolErrorResult {
  return {
    error: {
      details,
      message,
      timestamp: new Date().toISOString(),
    },
    success: false,
  };
}

/**
 * Helper function to create a standardized success result
 * @param result The result data
 * @returns A formatted success result object
 */
export function createToolSuccessResult<T>(result: T): ToolSuccessResult<T> {
  return {
    result,
    success: true,
  };
}
