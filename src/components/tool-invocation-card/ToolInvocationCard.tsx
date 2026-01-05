import { CaretDown, Eye, Robot } from "@phosphor-icons/react";
import { useState } from "react";
import {
  getFriendlyToolName,
  getToolCategory,
  ToolCategory
} from "@/agent/tools/utils";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Tooltip } from "@/components/tooltip/Tooltip";
import { APPROVAL } from "@/shared";
import type { ToolInvocation } from "../../types/tool-invocation";

interface ToolInvocationCardProps {
  toolInvocation: ToolInvocation;
  toolCallId: string;
  needsConfirmation: boolean;
  addToolResult: (args: { toolCallId: string; result: string }) => void;
}

// Helper function to get a CSS class based on tool category
const getCategoryColorClass = (category: ToolCategory): string => {
  switch (category) {
    case ToolCategory.BROWSER:
      return "text-blue-500 dark:text-blue-400";
    case ToolCategory.CONTEXT:
      return "text-green-500 dark:text-green-400";
    case ToolCategory.EMAIL:
      return "text-purple-500 dark:text-purple-400";
    case ToolCategory.CRM:
      return "text-yellow-500 dark:text-yellow-400";
    case ToolCategory.MESSAGING:
      return "text-pink-500 dark:text-pink-400";
    case ToolCategory.TESTING:
      return "text-orange-500 dark:text-orange-400";
    default:
      return "text-gray-500 dark:text-gray-400";
  }
};

export function ToolInvocationCard({
  toolInvocation,
  toolCallId,
  needsConfirmation,
  addToolResult
}: ToolInvocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(needsConfirmation);
  const [showRawData, setShowRawData] = useState(false);

  // Check if the tool invocation has an error
  const hasError =
    toolInvocation.state === "result" &&
    toolInvocation.result &&
    typeof toolInvocation.result === "object" &&
    toolInvocation.result.success === false &&
    toolInvocation.result.error;

  // Format a human-readable summary of the tool action
  const getActionSummary = () => {
    const { toolName, args } = toolInvocation;

    // Customize based on tool type for a more natural language description with args
    switch (toolName) {
      case "createLead":
        return `Create a lead for ${args.name || "someone"} from ${args.company || "a company"}`;
      case "updateLead":
        return `Update lead information for ${args.name || args.id || "a lead"}`;
      case "searchLeads":
        return `Search for leads ${args.query ? `matching "${args.query}"` : ""}`;
      case "getWeatherInformation":
        return `Get weather information for ${args.location || "a location"}`;
      default:
        // For all other tools, just use the friendly name from our registry
        return getFriendlyToolName(toolName);
    }
  };

  // Format a human-readable summary of the tool result
  const getResultSummary = () => {
    if (!toolInvocation.result) return "No result available";

    const result = toolInvocation.result;

    // Handle error results
    if (hasError && result.error) {
      // Return a cleaner error message without the stack trace
      const errorMessage = result.error.message;
      // Extract just the first line of the error message if it contains newlines
      return `Error: ${errorMessage.split("\n")[0]}`;
    }

    // If it has content array, extract meaningful text
    if (typeof result === "object" && result.content) {
      return result.content
        .map((item: { type: string; text: string }) => {
          if (item.type === "text") {
            // For browser results with URL info, format nicely
            if (item.text.startsWith("\n~ Page URL:")) {
              return "Retrieved webpage information";
            }
            // For normal text, return as is
            return item.text;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");
    }

    // For simple success results
    if (typeof result === "object" && "success" in result) {
      if ("message" in result) {
        return result.message as string;
      }
      return result.success
        ? "Operation completed successfully"
        : "Operation failed";
    }

    // Fallback
    return "Action completed";
  };

  // Format the error details for better display
  const formatErrorDetails = (details?: string) => {
    if (!details) return null;

    // Try to find the most meaningful part of the error stack
    const lines = details.split("\n");

    // If it's a short message, just return it
    if (lines.length <= 3) return details;

    // For stack traces, extract the first few lines that contain the most relevant information
    const relevantLines = lines.slice(0, 3);

    return relevantLines.join("\n") + (lines.length > 3 ? "\n..." : "");
  };

  // Get the tool category label
  const toolCategory = getToolCategory(toolInvocation.toolName);

  return (
    <Card
      className={`p-4 my-3 w-full max-w-[500px] rounded-md bg-neutral-100 dark:bg-neutral-900 ${
        needsConfirmation
          ? ""
          : hasError
            ? "border-red-300 dark:border-red-800"
            : "border-[#F48120]/30"
      } overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 cursor-pointer"
      >
        <div
          className={`${
            needsConfirmation
              ? "bg-[#F48120]/10"
              : hasError
                ? "bg-red-100 dark:bg-red-900/20"
                : "bg-[#F48120]/5"
          } p-1.5 rounded-full flex-shrink-0`}
        >
          <Robot
            size={16}
            className={hasError ? "text-red-500" : "text-[#F48120]"}
          />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{getActionSummary()}</h4>
            {!needsConfirmation &&
              toolInvocation.state === "call" && (
                <span className="text-xs text-[#F48120]/70 flex items-center gap-1">
                  <span className="animate-spin inline-block w-3 h-3 border border-[#F48120]/50 border-t-[#F48120] rounded-full" />
                  Executing...
                </span>
              )}
            {!needsConfirmation &&
              toolInvocation.state === "result" &&
              !hasError && (
                <span className="text-xs text-[#F48120]/70">✓ Completed</span>
              )}
            {hasError && <span className="text-xs text-red-500">× Failed</span>}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className={getCategoryColorClass(toolCategory)}>
              {toolCategory}
            </span>
          </div>
        </div>
        <CaretDown
          size={16}
          className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`transition-all duration-200 ${isExpanded ? "max-h-[300px] opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"}`}
      >
        <div
          className="overflow-y-auto"
          style={{ maxHeight: isExpanded ? "280px" : "0px" }}
        >
          {/* Executing state - tool is running but doesn't need confirmation */}
          {!needsConfirmation && toolInvocation.state === "call" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-[#F48120]/30 border-t-[#F48120] rounded-full" />
              <span>Running {getFriendlyToolName(toolInvocation.toolName)}...</span>
            </div>
          )}

          {/* Action details and confirmation buttons */}
          {needsConfirmation && toolInvocation.state === "call" && (
            <>
              <div className="mb-3 text-sm">
                <p className="mb-2">The AI wants to perform this action:</p>
                <div className="bg-background/80 p-2 rounded-md">
                  <strong>
                    {getFriendlyToolName(toolInvocation.toolName)}
                  </strong>
                  <ul className="mt-1">
                    {Object.entries(toolInvocation.args).map(([key, value]) => (
                      <li key={key} className="text-sm">
                        <strong>{key}:</strong>{" "}
                        {typeof value === "string"
                          ? value
                          : JSON.stringify(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    addToolResult({
                      result: APPROVAL.NO,
                      toolCallId
                    })
                  }
                >
                  Reject
                </Button>
                <Tooltip content={"Accept action"}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      addToolResult({
                        result: APPROVAL.YES,
                        toolCallId
                      })
                    }
                  >
                    Approve
                  </Button>
                </Tooltip>
              </div>
            </>
          )}

          {/* Show result for completed tool invocations */}
          {!needsConfirmation && toolInvocation.state === "result" && (
            <div className="mt-1">
              <p className="text-sm mb-2">{getResultSummary()}</p>

              {/* Error details when error is present */}
              {hasError && toolInvocation.result?.error && (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-3 rounded-md text-sm text-red-700 dark:text-red-300 mb-3">
                  <p className="font-semibold mb-1">
                    Error:{" "}
                    {formatErrorDetails(toolInvocation.result.error.message)}
                  </p>
                  {toolInvocation.result.error.details && (
                    <p className="text-xs mt-1 text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">
                      {formatErrorDetails(toolInvocation.result.error.details)}
                    </p>
                  )}
                  <p className="text-xs mt-1 text-red-600/70 dark:text-red-400/70">
                    {new Date(
                      toolInvocation.result.error.timestamp
                    ).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Toggle to show raw data */}
              <button
                type="button"
                onClick={() => setShowRawData(!showRawData)}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary mt-1"
              >
                <Eye size={12} aria-hidden="true" />
                {showRawData
                  ? "Hide technical details"
                  : "Show technical details"}
              </button>

              {/* Raw data shown only when toggled */}
              {showRawData && (
                <div className="mt-2 border-t border-[#F48120]/10 pt-2">
                  <div className="mb-2">
                    <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                      Tool:{" "}
                      <span className="text-foreground">
                        {getFriendlyToolName(toolInvocation.toolName)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({toolInvocation.toolName})
                      </span>
                    </h5>
                    <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                      Arguments:
                    </h5>
                    <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap break-words max-w-[450px]">
                      {JSON.stringify(toolInvocation.args, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                      Result:
                    </h5>
                    <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap break-words max-w-[450px]">
                      {JSON.stringify(toolInvocation.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
