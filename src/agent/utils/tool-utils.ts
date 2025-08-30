import { type UIMessage } from "ai";
import {
  convertToModelMessages,
  type DataStreamWriter,
  type ToolExecutionOptions,
  type ToolSet
} from "ai";
import { z } from "zod/v3";
import { APPROVAL } from "../../shared";
import type { AgentMode } from "../AppAgent";

function isValidToolName<K extends PropertyKey, T extends object>(
  key: K,
  obj: T
): key is K & keyof T {
  return key in obj;
}

/**
 * Validate whether a tool can be used in the current agent mode
 * @param toolName Name of the tool being executed
 * @param mode Current agent mode
 * @returns Boolean indicating if the tool is allowed in this mode
 */
export function validateToolAccessForMode(
  toolName: string,
  mode: AgentMode
): boolean {
  // Base tools available in all modes
  const universalTools = [
    "getWeatherInformation",
    "getLocalTime",
    "browseWebPage",
    "scheduleTask",
    "getScheduledTasks",
    "cancelScheduledTask",
    "getAgentState",
    "getCompanyConfig",
    "getTestingState",
    "getCrmState"
  ];

  // CRM-specific tools (only available in CRM and testing modes)
  const crmTools = [
    // These will be implemented as the project progresses
    "createLead",
    "updateLead",
    "searchLeads",
    "getLeadDetails",
    "sendLeadEmail",
    "createTask",
    "logInteraction",
    "advanceFunnelStage"
  ];

  // Testing-specific tools (only available in testing mode)
  const testingTools = [
    "recordTestResult",
    "documentTool",
    "generateTestReport",
    "saveCrmToolDocumentation",
    "completeTestingPhase"
  ];

  // Onboarding-specific tools (only available in onboarding mode)
  const onboardingTools = [
    "saveSettings",
    "saveCompanyInfo",
    "saveProductInfo",
    "saveFunnelStages",
    "saveQualificationCriteria",
    "saveObjectionResponses",
    "saveTemplates",
    "saveCommunicationChannels",
    "savePlaybook",
    "saveToolingPlan",
    "completeOnboarding",
    "checkExistingConfig",
    "getOnboardingStatus"
  ];

  // If it's a universal tool, always allow
  if (universalTools.includes(toolName)) {
    return true;
  }

  // Check mode-specific permissions
  switch (mode) {
    case "integration":
      // Integration mode can use both testing-specific tools and action tools
      return testingTools.includes(toolName) || crmTools.includes(toolName);
    case "onboarding":
      return onboardingTools.includes(toolName);
    case "plan":
      // Plan mode only has universal tools
      return false;
    case "act":
      return crmTools.includes(toolName);
    default:
      return false;
  }
}

/**
 * Processes tool invocations where human input is required, executing tools when authorized.
 *
 * @param options - The function options
 * @param options.tools - Map of tool names to Tool instances that may expose execute functions
 * @param options.dataStream - Data stream for sending results back to the client
 * @param options.messages - Array of messages to process
 * @param executionFunctions - Map of tool names to execute functions
 * @returns Promise resolving to the processed messages
 */
export async function processToolCalls<
  Tools extends ToolSet,
  ExecutableTools extends {
    // biome-ignore lint/complexity/noBannedTypes: it's fine
    [Tool in keyof Tools as Tools[Tool] extends { execute: Function }
      ? never
      : Tool]: Tools[Tool];
  }
>({
  dataStream,
  messages,
  executions
}: {
  tools: Tools; // used for type inference
  dataStream: DataStreamWriter;
  messages: UIMessage[];
  executions: {
    [K in keyof Tools & keyof ExecutableTools]?: (
      args: z.infer<ExecutableTools[K]["parameters"]>,
      context: ToolExecutionOptions
    ) => Promise<unknown>;
  };
}): Promise<UIMessage[]> {
  const lastMessage = messages[messages.length - 1];
  const parts = lastMessage.parts;
  if (!parts) return messages;

  const processedParts = await Promise.all(
    parts.map(async (part) => {
      // Only process tool invocations parts
      if (part.type !== "tool-invocation") return part;

      const { toolInvocation } = part;
      const toolName = toolInvocation.toolName;

      // Only continue if we have an execute function for the tool (meaning it requires confirmation) and it's in a 'result' state
      if (!(toolName in executions) || toolInvocation.state !== "result")
        return part;

      let result: unknown;

      if (toolInvocation.result === APPROVAL.YES) {
        // Get the tool and check if the tool has an execute function.
        if (
          !isValidToolName(toolName, executions) ||
          toolInvocation.state !== "result"
        ) {
          return part;
        }

        const toolInstance = executions[toolName];
        if (toolInstance) {
          result = await toolInstance(toolInvocation.args, {
            messages: convertToModelMessages(messages),
            toolCallId: toolInvocation.toolCallId
          });
        } else {
          result = "Error: No execute function found on tool";
        }
      } else if (toolInvocation.result === APPROVAL.NO) {
        result = "Error: User denied access to tool execution";
      } else {
        // For any unhandled responses, return the original part.
        return part;
      }

      // Forward updated tool result to the client.
      dataStream.write({
        type: "tool-result",

        value: {
          result,
          toolCallId: toolInvocation.toolCallId
        }
      });

      // Return updated toolInvocation with the actual result.
      return {
        ...part,
        toolInvocation: {
          ...toolInvocation,
          result
        }
      };
    })
  );

  // Finally return the processed messages
  return [...messages.slice(0, -1), { ...lastMessage, parts: processedParts }];
}

/**
 * Enhanced tool call processor that adds mode-based access validation
 * @param params Parameters for processing tool calls
 * @returns Processed messages
 */
export async function processToolCallsWithModeValidation<
  Tools extends ToolSet
>({
  messages,
  dataStream,
  tools: _tools,
  executions,
  mode
}: {
  messages: UIMessage[];
  dataStream: DataStreamWriter;
  tools: Tools; // unused but needed for type inference
  executions: Record<
    string,
    (args: unknown, context: ToolExecutionOptions) => Promise<unknown>
  >;
  mode: AgentMode;
}): Promise<UIMessage[]> {
  const lastMessage = messages[messages.length - 1];
  const parts = lastMessage.parts;
  if (!parts) return messages;

  const processedParts = await Promise.all(
    parts.map(async (part) => {
      // Only process tool invocation parts
      if (part.type !== "tool-invocation") return part;

      const { toolInvocation } = part;
      const toolName = toolInvocation.toolName;

      // First verify if the tool is allowed in the current mode
      if (!validateToolAccessForMode(toolName, mode)) {
        // Tool is not allowed in this mode - use formatDataStreamPart to send error
        const errorResult = `Tool '${toolName}' is not available in ${mode} mode. Please use tools that are appropriate for the current mode.`;

        // Forward error to the client
        dataStream.write({
          type: "tool-result",

          value: {
            result: errorResult,
            toolCallId: toolInvocation.toolCallId
          }
        });

        // Return updated toolInvocation with the error result
        // Using proper state values that match the ToolInvocation type
        return {
          ...part,
          toolInvocation: {
            ...toolInvocation,
            result: errorResult,
            state: "result"
          }
        };
      }

      // If tool is allowed and requires confirmation, process it normally
      if (toolName in executions && toolInvocation.state === "result") {
        let result: unknown;

        if (toolInvocation.result === APPROVAL.YES) {
          // Get the tool and execute it
          if (isValidToolName(toolName, executions)) {
            const toolInstance = executions[toolName];
            if (toolInstance) {
              result = await toolInstance(toolInvocation.args, {
                messages: convertToModelMessages(messages),
                toolCallId: toolInvocation.toolCallId
              });
            } else {
              result = "Error: No execute function found on tool";
            }
          }
        } else if (toolInvocation.result === APPROVAL.NO) {
          result = "Error: User denied access to tool execution";
        } else {
          // For any unhandled responses, return the original part
          return part;
        }

        // Forward updated tool result to the client
        dataStream.write({
          type: "tool-result",

          value: {
            result,
            toolCallId: toolInvocation.toolCallId
          }
        });

        // Return updated toolInvocation with the actual result
        return {
          ...part,
          toolInvocation: {
            ...toolInvocation,
            result
          }
        };
      }

      // No special handling needed, return part unmodified
      return part;
    })
  );

  // Return the processed messages with type assertion to avoid type error
  return [
    ...messages.slice(0, -1),
    { ...lastMessage, parts: processedParts } as UIMessage
  ];
}

// Define a type for tool calls that matches what we need
interface BasicToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  output?: string;
}

// Define a simplified part type
type ToolInvocationPart = {
  type: "tool-invocation";
  toolInvocation: {
    toolCallId: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

// Function to check if a part is a tool invocation part
function isToolInvocationPart(part: {
  type: string;
  [key: string]: unknown;
}): part is ToolInvocationPart {
  return (
    part.type === "tool-invocation" &&
    "toolInvocation" in part &&
    typeof part.toolInvocation === "object" &&
    part.toolInvocation !== null &&
    "toolCallId" in part.toolInvocation
  );
}

// Define a simplified message structure that we know works
type SimplifiedMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  parts?: Array<{
    type: string;
    [key: string]: unknown;
  }>;
  // Add any other properties needed
};

export function processToolCallsFromContent(
  messages: SimplifiedMessage[],
  toolCalls: BasicToolCall[]
): SimplifiedMessage[] {
  if (messages.length === 0 || toolCalls.length === 0) {
    return messages;
  }

  // Get the last message
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage.parts) {
    return messages;
  }

  // Create processed tool invocations
  const processedParts = [...lastMessage.parts];

  // For each tool call, create a tool invocation part
  for (const toolCall of toolCalls) {
    // Only process new tool calls
    if (
      !processedParts.some((part) => {
        if (isToolInvocationPart(part)) {
          return part.toolInvocation.toolCallId === toolCall.id;
        }
        return false;
      })
    ) {
      const toolInvocationPart = {
        toolInvocation: {
          args: toolCall.args,
          result: toolCall.output || "",
          state: "result" as const,
          step: undefined,
          toolCallId: toolCall.id,
          toolName: toolCall.name
        },
        type: "tool-invocation" as const
      };
      processedParts.push(toolInvocationPart);
    }
  }

  // Create a clone of the last message with the updated parts
  const updatedLastMessage = {
    ...lastMessage,
    parts: processedParts
  };

  // Return the updated messages array, replacing the last message
  return [...messages.slice(0, -1), updatedLastMessage];
}
