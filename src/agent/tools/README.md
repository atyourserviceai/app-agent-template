# Agent Tools

This directory contains tool implementations that agents can use to perform various actions. Tools are the primary way that agents interact with external systems and provide capabilities beyond simple text generation.

## Tool Categories

The tools are organized into the following categories:

- **CRM Tools**: Tools for managing lead data and CRM operations
- **Scheduling Tools**: Tools for scheduling tasks and managing time-based operations
- **Search Tools**: Tools for searching and retrieving information
- **Messaging Tools**: Tools for sending messages through various channels
- **Context Tools**: Tools for retrieving contextual information like weather or local time

## Tool Structure

Each tool should be defined using the `tool` function from the `agents` package:

```typescript
export const myTool = tool({
  description: "Description of what the tool does",
  parameters: z.object({
    param1: z.string().describe("Description of parameter 1"),
    param2: z.number().optional().describe("Description of parameter 2")
  }),
  execute: async ({ param1, param2 }, { agent }) => {
    // Implementation of the tool
    return "Result of the tool execution";
  }
});
```

## Tool Approval Flow

Some tools should require human approval before execution. These are defined without an `execute` function:

```typescript
export const toolRequiringApproval = tool({
  description: "Description of what the tool does",
  parameters: z.object({
    param1: z.string().describe("Description of parameter 1")
  })
  // No execute function = requires approval
});
```

Then, provide an execution function in the `executions` object:

```typescript
export const executions = {
  toolRequiringApproval: async ({ param1 }) => {
    // Implementation for when the tool is approved
    return "Result of the approved tool execution";
  }
};
```

## Adding New Tools

To add a new tool:

1. Decide which category it belongs to or create a new one
2. Implement the tool following the structure above
3. Export it from the appropriate file
4. Add it to the tools registry in tools.ts

## Tool Context

Tools have access to the agent context through the second parameter of the `execute` function:

```typescript
execute: async (params, { agent, messages, toolCallId }) => {
  // Access agent state
  const currentState = agent.state;

  // Access messages
  const lastMessage = messages[messages.length - 1];

  // Return result
  return "Tool result";
};
```

This allows tools to access state, conversation history, and other context when performing their actions.
