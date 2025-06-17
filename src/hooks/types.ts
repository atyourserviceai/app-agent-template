/**
 * Type definitions for hooks.
 */

/**
 * Structured error data for display in the UI.
 */
export interface ErrorData {
  message: string;
  details: string;
  timestamp: string;
}

/**
 * Error response structure, typically from API calls.
 */
export interface ErrorResponse {
  message?: string;
  statusCode?: number;
  responseBody?: string;
  cause?: unknown;
}

/**
 * Error with additional context.
 */
export interface ContextualError extends Error {
  cause?: unknown;
  statusCode?: number;
  responseBody?: string;
}
