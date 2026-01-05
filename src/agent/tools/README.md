# Agent Tools

This directory contains tool implementations that agents can use to perform various actions. Tools are the primary way that agents interact with external systems and provide capabilities beyond simple text generation.

## Tool Categories

The tools are organized into the following categories:

- **Browser Tools**: Web browsing and page interaction
- **Context Tools**: Contextual information (weather, time, etc.)
- **Scheduling Tools**: Task scheduling and time-based operations
- **Search Tools**: Searching and retrieving information
- **Messaging Tools**: Sending messages through various channels
- **Integration Tools**: Testing and documenting tool integrations
- **State Tools**: Agent state management

## Tool Structure

Each tool should be defined using the `tool` function from AI SDK v6:

```typescript
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "Description of what the tool does",
  parameters: z.object({
    param1: z.string().describe("Description of parameter 1"),
    param2: z.number().optional().describe("Description of parameter 2")
  }),
  execute: async ({ param1, param2 }) => {
    // Implementation of the tool
    return "Result of the tool execution";
  }
});
```

**Important:** AI SDK v6 tools use `parameters` (not `inputSchema`) and the execute function receives only the parameters object.

## Error Handling Wrapper

All tools should be wrapped with error handling before being exported from `registry.ts`:

```typescript
import { wrapToolWithErrorHandling, wrapAllToolsWithErrorHandling } from "./wrappers";

// Wrap a single tool
export const myTool = wrapToolWithErrorHandling(rawMyTool);

// Wrap all tools in a module
export const contextTools = wrapAllToolsWithErrorHandling(rawContextTools);
```

The wrapper catches errors and returns them in a standardized format with `success: false` and error details.

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

Then, provide an execution function in the `executions` object in `registry.ts`:

```typescript
export const executions = {
  toolRequiringApproval: async ({ param1 }: { param1: string }) => {
    // Implementation for when the tool is approved
    return "Result of the approved tool execution";
  }
};
```

## Adding New Tools

To add a new tool:

1. Decide which category it belongs to or create a new file in this directory
2. Implement the tool following the structure above (using `tool` from `"ai"`)
3. Export it from the category file
4. Import and wrap it in `registry.ts`
5. Add it to the `tools` object export

## Tool Registry

The `registry.ts` file is the single source of truth for all tools:

```typescript
// registry.ts
import * as rawContextTools from "./context";
import { wrapAllToolsWithErrorHandling } from "./wrappers";

export const contextTools = wrapAllToolsWithErrorHandling(rawContextTools);

export const tools = {
  getWeatherInformation: contextTools.getWeatherInformation,
  getLocalTime: contextTools.getLocalTime,
  // ... other tools
};
```

## Tool Invocation UI

When tools are invoked, the `ToolInvocationCard` component displays:

- **Executing state**: Shows spinner with "Executing..." while tool runs
- **Completed state**: Shows "Completed" checkmark with result summary
- **Error state**: Shows "Failed" with error details

The card is collapsible and includes a "Show technical details" toggle for raw data inspection.
