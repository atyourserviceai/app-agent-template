import type { UIMessage } from "ai";
import { isToolUIPart, getToolName } from "ai";

// Alias for backward compatibility
type Message = UIMessage;

/**
 * Get text content from a UIMessage (v6 uses parts array)
 */
function getMessageText(message: Message): string {
  const textPart = message.parts?.find((p) => p.type === "text");
  return textPart?.text || "";
}

/**
 * Get tool parts from a UIMessage (v6 uses tool-${toolName} parts)
 */
function getToolParts(message: Message): Array<{
  toolName: string;
  input: unknown;
  output: unknown;
}> {
  return (message.parts || []).filter(isToolUIPart).map((part) => ({
    toolName: getToolName(part),
    input: part.input,
    output: part.output
  }));
}

/**
 * Export conversation messages to markdown format
 */
export function exportConversationToMarkdown(messages: Message[]): string {
  const lines: string[] = [];

  // Add header
  lines.push("# IdeaPotential Conversation Export");
  lines.push("");
  lines.push(
    `**Exported on:** ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  messages.forEach((message, index) => {
    // Add message header
    if (message.role === "user") {
      lines.push("## User");
      lines.push("");
      lines.push(getMessageText(message));
    } else if (message.role === "assistant") {
      lines.push("## Assistant");
      lines.push("");

      // Get tool parts from the message (v6 format)
      const toolParts = getToolParts(message);

      // Add tool invocations if present
      if (toolParts.length > 0) {
        lines.push("### Tool Calls");
        lines.push("");

        toolParts.forEach((tool) => {
          lines.push(`**${tool.toolName}**`);
          if (
            tool.input &&
            typeof tool.input === "object" &&
            Object.keys(tool.input as object).length > 0
          ) {
            lines.push("```json");
            lines.push(JSON.stringify(tool.input, null, 2));
            lines.push("```");
          }

          if (tool.output) {
            lines.push("");
            lines.push("*Result:*");
            if (typeof tool.output === "string") {
              lines.push(tool.output);
            } else {
              lines.push("```json");
              lines.push(JSON.stringify(tool.output, null, 2));
              lines.push("```");
            }
          }
          lines.push("");
        });
      }

      // Add assistant text response if present
      const textContent = getMessageText(message);
      if (textContent) {
        if (toolParts.length > 0) {
          lines.push("### Response");
          lines.push("");
        }
        lines.push(textContent);
      }
    }

    lines.push("");

    // Add separator between messages (except last one)
    if (index < messages.length - 1) {
      lines.push("---");
      lines.push("");
    }
  });

  return lines.join("\n");
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand("copy");
      document.body.removeChild(textArea);
      return result;
    } catch (fallbackError) {
      console.error("Fallback copy also failed:", fallbackError);
      return false;
    }
  }
}
