import type { UIMessage } from "ai";

// Alias for backward compatibility
type Message = UIMessage;
import type { ErrorData, ErrorResponse } from "./types";

export function useErrorHandling() {
  // Detect if a message is an error message
  const isErrorMessage = (message: Message): boolean => {
    if (message.role !== "assistant") return false;

    // Check if any part contains the error marker
    return !!message.parts?.some(
      (part) =>
        part.type === "text" &&
        typeof part.text === "string" &&
        part.text.startsWith("__ERROR__")
    );
  };

  // Parse error data from an error message
  const parseErrorData = (message: Message): ErrorData => {
    try {
      const errorPart = message.parts?.find(
        (part) =>
          part.type === "text" &&
          typeof part.text === "string" &&
          part.text.startsWith("__ERROR__")
      );

      if (!errorPart)
        return {
          details: "",
          message: "Unknown error",
          timestamp: new Date().toISOString()
        };

      // Convert to MessagePart with text property
      const textPart = errorPart as { type: "text"; text: string };
      const errorJson = textPart.text.substring(9); // Remove __ERROR__ prefix
      return JSON.parse(errorJson);
    } catch (_e) {
      return {
        details: "",
        message: "Error parsing error message",
        timestamp: new Date().toISOString()
      };
    }
  };

  // Format error for storing as a message
  const formatErrorForMessage = (
    error: Error | ErrorResponse | unknown
  ): string => {
    const errorDetails = formatErrorMessage(error);
    const errorData: ErrorData = {
      details: errorDetails,
      message: "The AI was unable to respond",
      timestamp: new Date().toISOString()
    };

    return `__ERROR__${JSON.stringify(errorData)}`;
  };

  // Helper function to format error messages
  const formatErrorMessage = (
    error: Error | ErrorResponse | unknown
  ): string => {
    if (!error) return "Unknown error occurred";

    // Handle Error or ErrorResponse with message property
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      const typedError = error as Error | ErrorResponse;

      // Check for ContextualError with cause
      if ("cause" in error && error.cause !== undefined) {
        return `${typedError.message}\nCause: ${JSON.stringify(error.cause, null, 2)}`;
      }

      // Check for ErrorResponse with statusCode and responseBody
      if ("statusCode" in error && "responseBody" in error) {
        const apiError = error as ErrorResponse;
        const statusCode = apiError.statusCode?.toString() || "unknown";
        const responseBody = apiError.responseBody || "No response body";
        return `${typedError.message}\nStatus: ${statusCode}\nResponse: ${responseBody}`;
      }

      // Ensure message property is always a string
      return typedError.message || "Unknown error";
    }

    // For complex objects, stringify with pretty-printing
    try {
      return JSON.stringify(error, null, 2);
    } catch (_e) {
      return String(error);
    }
  };

  return {
    formatErrorForMessage,
    formatErrorMessage,
    isErrorMessage,
    parseErrorData
  };
}
