# Migration Guide: AI SDK v4 → v6

This guide covers migrating demos from the older AI SDK v4/agents package to the current AI SDK v6 with `@cloudflare/ai-chat`.

## Overview of Changes

| Component | Old Version | New Version |
|-----------|-------------|-------------|
| `ai` | ^4.x | ^6.0.x |
| `agents` | ^0.0.x | ^0.3.x |
| `@ai-sdk/react` | ^1.x | ^3.x |
| `@ai-sdk/openai` | ^1.x | ^3.x |
| `@ai-sdk/anthropic` | ^1.x | ^3.x |
| `@ai-sdk/google` | ^1.x | ^2.x |
| `@cloudflare/ai-chat` | N/A | ^0.0.3 (NEW) |

## Migration Steps

### 1. Update package.json Dependencies

```json
{
  "dependencies": {
    "@ai-sdk/anthropic": "^3.0.2",
    "@ai-sdk/google": "^2.0.5",
    "@ai-sdk/openai": "^3.0.2",
    "@ai-sdk/openai-compatible": "^2.0.2",
    "@ai-sdk/react": "^3.0.0",
    "@cloudflare/ai-chat": "0.0.3",
    "agents": "^0.3.3",
    "ai": "^6.0.6"
  }
}
```

Run `pnpm install` after updating.

### 2. Update Chat Hook Import and Usage

#### Old Pattern (v4)

```typescript
import { useAgentChat } from "agents/ai-react";

const {
  messages: agentMessages,
  input,
  handleInputChange,
  handleSubmit,
  clearHistory,
  setMessages,
  isLoading,
} = useAgentChat({
  agent,
  maxSteps: 5,
  onError: (error) => {
    // ❌ This pattern is unreliable in v6
    // Messages may be in unstable state during error
    const errorMessage = formatError(error);
    setMessages([...messages, errorMessage]);
  },
});
```

#### New Pattern (v6)

```typescript
import { useAgentChat } from "@cloudflare/ai-chat/react";

// Add type assertion for the error state
const chatResult = useAgentChat({
  agent,
  maxSteps: 5,
  onError: (error) => {
    // Only use for logging, not for modifying messages
    console.error("Chat error:", error);
  },
}) as ReturnType<typeof useAgentChat> & { error: Error | undefined };

const {
  messages: agentMessages,
  input,
  handleInputChange,
  handleSubmit,
  clearHistory,
  setMessages,
  isLoading,
  error: chatError,  // ← NEW: error state from hook
} = chatResult;

// Handle errors via useEffect
const lastProcessedErrorRef = useRef<string | null>(null);

useEffect(() => {
  if (!chatError) {
    lastProcessedErrorRef.current = null;
    return;
  }

  // Prevent duplicate error messages
  if (lastProcessedErrorRef.current === chatError.message) {
    return;
  }
  lastProcessedErrorRef.current = chatError.message;

  // Check if error message already exists
  const hasExistingError = agentMessages.some((msg) =>
    msg.role === "assistant" &&
    msg.parts?.some((p) => p.type === "text" && p.text.startsWith("__ERROR__"))
  );
  if (hasExistingError) return;

  // Add error message to chat
  const errorMessage = {
    id: crypto.randomUUID(),
    role: "assistant" as const,
    parts: [{ type: "text" as const, text: `__ERROR__: ${chatError.message}` }]
  };

  setMessages([...agentMessages, errorMessage]);
}, [chatError, setMessages, agentMessages]);
```

### 3. Update Error Message Detection

#### Old Pattern

```typescript
// Checking for emoji-based error format
const isError = message.content?.startsWith("⚠️ Error:");
```

#### New Pattern

```typescript
// Use __ERROR__ prefix format
function isErrorMessage(message: UIMessage): boolean {
  if (message.role !== "assistant") return false;

  const textPart = message.parts?.find((p) => p.type === "text");
  if (!textPart || textPart.type !== "text") return false;

  return textPart.text.startsWith("__ERROR__");
}

// In rendering
const displayText = isErrorMessage(message)
  ? message.parts[0].text.replace("__ERROR__: ", "⚠️ Error: ")
  : message.parts[0].text;
```

### 4. Handle Empty Messages During Errors

AI SDK v6 may create empty assistant messages (`parts: []`) during errors. Filter these out:

```typescript
// Filter empty messages when rendering
const visibleMessages = agentMessages.filter((msg, idx) => {
  // Keep all non-assistant messages
  if (msg.role !== "assistant") return true;

  // Always keep the last message (might be in-progress)
  if (idx === agentMessages.length - 1) return true;

  // Filter out empty assistant messages
  return msg.parts && msg.parts.length > 0;
});
```

### 5. Remove suggestActions Tool

The `suggestActions` tool has been deprecated. Remove all references:

#### Files to Update

1. **`src/agent/tools/messaging.ts`** - Remove `suggestActions` export
2. **`src/agent/tools/index.ts`** - Remove from tools object
3. **`src/agent/tools/utils.ts`** - Remove from toolRegistry
4. **`src/agent/tools/types.ts`** - Remove type definition
5. **`src/agent/AppAgent.ts`** - Remove from baseTools
6. **`src/agent/prompts/unified.ts`** - Remove from tool list and ACTION BUTTONS GUIDELINES section
7. **`src/components/tool-invocation-card/ToolInvocationCard.tsx`** - Remove skip handler

#### Optional: Remove SuggestedActions Component

If you had a `SuggestedActions` component:

```typescript
// Remove from app.tsx
- import { SuggestedActions } from "./components/suggested-actions";
- const [actionButtons, setActionButtons] = useState<ActionButton[]>([]);

// Remove the component and related state management
```

### 6. Update Tool Invocation Card

Add "Executing..." state for tools that are running:

```typescript
// In ToolInvocationCard.tsx header
{!needsConfirmation && toolInvocation.state === "call" && (
  <span className="text-xs text-[#F48120]/70 flex items-center gap-1">
    <span className="animate-spin inline-block w-3 h-3 border border-[#F48120]/50 border-t-[#F48120] rounded-full" />
    Executing...
  </span>
)}

// In expandable content area
{!needsConfirmation && toolInvocation.state === "call" && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <span className="animate-spin inline-block w-4 h-4 border-2 border-[#F48120]/30 border-t-[#F48120] rounded-full" />
    <span>Running {getFriendlyToolName(toolInvocation.toolName)}...</span>
  </div>
)}
```

### 7. Tool Definition Format (Optional)

Both `inputSchema` and `parameters` work in AI SDK v6, but `parameters` is the documented approach:

```typescript
// Both work:
export const myTool = tool({
  description: "...",
  inputSchema: z.object({ ... }),  // Legacy, still works
  execute: async (params) => { ... }
});

export const myTool = tool({
  description: "...",
  parameters: z.object({ ... }),  // Preferred
  execute: async (params) => { ... }
});
```

### 8. Update Refs for Message Stability

Add refs to track stable message state:

```typescript
// Track last known good messages for error recovery
const lastKnownMessagesRef = useRef<UIMessage[]>([]);

useEffect(() => {
  if (agentMessages.length > 0 && !chatError) {
    lastKnownMessagesRef.current = [...agentMessages];
  }
}, [agentMessages, chatError]);
```

## Breaking Changes Checklist

- [ ] Updated all `@ai-sdk/*` packages to v2/v3
- [ ] Updated `ai` package to v6
- [ ] Updated `agents` package to v0.3.x
- [ ] Added `@cloudflare/ai-chat` package
- [ ] Changed `useAgentChat` import to `@cloudflare/ai-chat/react`
- [ ] Added `error` state extraction from chat hook
- [ ] Moved error handling from `onError` callback to `useEffect`
- [ ] Updated error message format to use `__ERROR__` prefix
- [ ] Added empty message filtering
- [ ] Removed `suggestActions` tool and all references
- [ ] Added "Executing..." state to ToolInvocationCard
- [ ] Updated any custom error detection logic

## Common Issues

### Error: "Cannot read properties of undefined (reading 'message')"

The error state may be undefined. Always check before accessing:

```typescript
if (!chatError) return;
```

### Error: Empty messages appearing in chat

SDK creates empty assistant messages during errors. Filter them:

```typescript
const hasContent = msg.parts && msg.parts.length > 0;
```

### Error: Duplicate error messages

Track processed errors with a ref:

```typescript
const lastProcessedErrorRef = useRef<string | null>(null);
if (lastProcessedErrorRef.current === chatError.message) return;
```

### Error: "suggestActions is not defined"

Remove all references to `suggestActions` - the tool has been deprecated.

## Testing Your Migration

1. **Test normal chat flow** - Send messages, verify responses
2. **Test error handling** - Trigger an error (e.g., invalid API key), verify error message appears
3. **Test tool invocations** - Verify tools show "Executing..." then "Completed"
4. **Test message editing** - Edit a message and resend
5. **Test retry functionality** - Retry a failed message
6. **Test clear history** - Clear and start fresh

## Demo-Specific Notes

### Ideapotential (Priority: High)

Currently on AI SDK v4 (`ai: ^4.3.19`, `agents: ^0.0.113`). Needs full migration:

1. Update all package versions per the table above
2. Add `@cloudflare/ai-chat` package
3. Update chat hook import and error handling
4. Check for `suggestActions` usage and remove if present
5. Update ToolInvocationCard if customized

**Note**: Ideapotential has custom assessment UI components that should not be affected by this migration. Focus on the chat/agent integration code.

### LLMDJ (Lower Priority)

- Has Spotify-specific tools that don't need changes
- Remove `suggestActions` from tools
- Update error handling in app.tsx

### Superfans (Lower Priority)

- Has CRM-specific tools that don't need changes
- Update to use new error handling pattern

## Resources

- [AI SDK v6 Documentation](https://sdk.vercel.ai/docs)
- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
- [app-agent-template README](../README.md)
