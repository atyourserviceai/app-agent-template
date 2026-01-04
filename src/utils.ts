// via https://github.com/vercel/ai/blob/main/examples/next-openai/app/api/use-chat-human-in-the-loop/utils.ts

import { type UIMessage } from "ai";
import {
  convertToModelMessages,
  type UIMessageStreamWriter,
  type ToolExecutionOptions,
  type ToolSet,
  isToolUIPart,
  getToolName
} from "ai";
import { APPROVAL } from "./shared";

function isValidToolName<K extends PropertyKey, T extends object>(
  key: K,
  obj: T
): key is K & keyof T {
  return key in obj;
}

/**
 * Processes tool invocations where human input is required, executing tools when authorized.
 * Updated for AI SDK v6 - uses tool-${toolName} parts instead of tool-invocation parts.
 *
 * @param options - The function options
 * @param options.tools - Map of tool names to Tool instances that may expose execute functions
 * @param options.dataStream - Data stream for sending results back to the client
 * @param options.messages - Array of messages to process
 * @param executions - Map of tool names to execute functions
 * @returns Promise resolving to the processed messages
 */
export async function processToolCalls<Tools extends ToolSet>({
  dataStream,
  messages,
  executions
}: {
  tools: Tools; // used for type inference
  dataStream: UIMessageStreamWriter;
  messages: UIMessage[];
  executions: Record<
    string,
    (args: unknown, context: ToolExecutionOptions) => Promise<unknown>
  >;
}): Promise<UIMessage[]> {
  const lastMessage = messages[messages.length - 1];
  const parts = lastMessage.parts;
  if (!parts) return messages;

  const processedParts = await Promise.all(
    parts.map(async (part) => {
      // Only process tool UI parts (v6: type is tool-${toolName})
      if (!isToolUIPart(part)) return part;

      const toolName = getToolName(part);
      const toolCallId = part.toolCallId;

      // Only continue if we have an execute function for the tool (meaning it requires confirmation)
      // and it's in 'output-available' state (v6 equivalent of 'result')
      if (!(toolName in executions) || part.state !== "output-available")
        return part;

      let result: unknown;

      if (part.output === APPROVAL.YES) {
        // Get the tool and check if the tool has an execute function.
        if (
          !isValidToolName(toolName, executions) ||
          part.state !== "output-available"
        ) {
          return part;
        }

        const toolInstance = executions[toolName];
        if (toolInstance) {
          result = await toolInstance(part.input, {
            messages: await convertToModelMessages(messages),
            toolCallId
          });
        } else {
          result = "Error: No execute function found on tool";
        }
      } else if (part.output === APPROVAL.NO) {
        result = "Error: User denied access to tool execution";
      } else {
        // For any unhandled responses, return the original part.
        return part;
      }

      // Forward updated tool result to the client using data stream (v6 format)
      dataStream.write({
        type: `data-tool-result`,
        data: {
          result,
          toolCallId
        }
      });

      // Return updated part with the actual result (v6 format)
      return {
        ...part,
        output: result,
        state: "output-available" as const
      };
    })
  );

  // Finally return the processed messages
  return [
    ...messages.slice(0, -1),
    { ...lastMessage, parts: processedParts }
  ] as UIMessage[];
}

// export function getToolsRequiringConfirmation<
//   T extends ToolSet
//   // E extends {
//   //   [K in keyof T as T[K] extends { execute: Function } ? never : K]: T[K];
//   // },
// >(tools: T): string[] {
//   return (Object.keys(tools) as (keyof T)[]).filter((key) => {
//     const maybeTool = tools[key];
//     return typeof maybeTool.execute !== "function";
//   }) as string[];
// }
