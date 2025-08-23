import type { Message, ToolInvocation } from "@ai-sdk/react";

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
      lines.push(message.content);
    } else if (message.role === "assistant") {
      lines.push("## Assistant");
      lines.push("");

      // Add tool invocations if present
      if (message.toolInvocations && message.toolInvocations.length > 0) {
        lines.push("### Tool Calls");
        lines.push("");

        message.toolInvocations.forEach((tool: ToolInvocation) => {
          lines.push(`**${tool.toolName}**`);
          if (tool.args && Object.keys(tool.args).length > 0) {
            lines.push("```json");
            lines.push(JSON.stringify(tool.args, null, 2));
            lines.push("```");
          }

          if (tool.result) {
            lines.push("");
            lines.push("*Result:*");
            if (typeof tool.result === "string") {
              lines.push(tool.result);
            } else {
              lines.push("```json");
              lines.push(JSON.stringify(tool.result, null, 2));
              lines.push("```");
            }
          }
          lines.push("");
        });
      }

      // Add assistant response if present
      if (message.content) {
        if (message.toolInvocations && message.toolInvocations.length > 0) {
          lines.push("### Response");
          lines.push("");
        }
        lines.push(message.content);
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
