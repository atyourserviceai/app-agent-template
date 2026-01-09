# 🤖 App Agent Template

![app-agent-template-header](https://github.com/user-attachments/assets/2a15d027-18cf-419b-952b-659e047154d1)

<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/atyourserviceai/app-agent-template"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>

A starter template for building **app agents** using Cloudflare's Agent platform, powered by [`agents`](https://www.pnpmjs.com/package/agents). An app agent is a React application that has access to the agent's state, allowing you to build rich user interfaces around AI conversation.

Integrated with **[AI@YourService](https://atyourservice.ai)** for authentication and LLM Gateway access, so users pay for their own AI usage instead of you footing the bill.

Based on Cloudflare's [agents-starter](https://github.com/cloudflare/agents-starter) with additional features:

- **Interactive PixiJS ball demo** showing AI-controlled state manipulation
- Enhanced chat functionality (message editing, retrying, error handling)
- Simple **plan/act mode** architecture for strategic thinking vs execution
- Better TypeScript types and organization
- **AI@YourService integration** for user authentication and cost-effective LLM access

## 🚀 Getting Started

To create a new app agent from this template:

1. **Clone template**: `git clone git@github.com:atyourserviceai/app-agent-template.git your-project-name`
2. **Set up git remotes**: Rename `origin` to `template`, create new repo, add as `origin`
3. **Update metadata**: Edit `package.json`, `wrangler.jsonc`, and `vite.config.ts` with your project details and unique ports
4. **Create OAuth apps**: Set up development, staging, and production OAuth applications in AI@YourService
5. **Configure secrets**: Set up `.dev.vars` for development and use `wrangler secret` for staging/production
6. **Test basic setup**: Run `pnpm run dev` and verify OAuth login works
7. **Customize agent**: Update system prompts, tools, and UI for your specific use case

📖 **For detailed step-by-step instructions, see [CUSTOMIZE.md](./CUSTOMIZE.md)**

## App Agent Architecture

This template shows how to build a React app that communicates with an AI agent:

### React App + Agent State

- **React Frontend**: Standard React application with components, state management, and UI
- **Agent Integration**: Direct access to agent state, messages, and capabilities
- **State Synchronization**: React components can read and display agent state in real-time
- **Rich UX**: Build any UI components needed to visualize and interact with agent data

### What You Can Build

Since the React app has access to the agent's state, you can create:

- Custom data visualizations of agent information
- Interactive forms and controls alongside chat
- Status indicators and progress displays
- Mode-specific UI that adapts to agent capabilities
- Persistent data displays (configuration summaries, settings, etc.)

### Technical Implementation

- Agent state is accessible through React hooks and context
- UI components can trigger agent actions and tool calls
- Chat interface is just one component among others
- Full control over styling, layout, and user experience

## Features

- 🤖 **App Agent Architecture**: React app with access to agent state for rich UX
- 🎱 **Interactive Ball Demo**: PixiJS-based physics simulation controlled by AI commands
- 🎯 **Plan/Act Modes**: Simple two-mode system for strategic thinking vs execution
- 💬 Interactive chat interface with AI
- ✏️ Enhanced chat functionality (edit messages, retry, error handling)
- 🛠️ Built-in tool system with human-in-the-loop confirmation
- 📅 Advanced task scheduling (one-time, delayed, and recurring via cron)
- 🌓 Dark/Light theme support (synced between UI and canvas)
- ⚡️ Real-time streaming responses
- 🔄 State management and chat history
- 🎨 Modern, responsive UI
- 🚀 Generic architecture for easy customization

## Interactive Ball Demo

This template includes an interactive PixiJS ball simulation that demonstrates how to:

1. **Expose UI state to the AI agent** via tools
2. **Let the AI control application state** through commands
3. **Allow users to interact with both UI and AI** simultaneously

### Ball Simulation Features

- **Physics simulation**: Balls bounce with gravity, friction, and wall collisions
- **Random gravity changes**: Gravity direction shifts every 5 seconds for visual interest
- **Click to create**: Click anywhere on the canvas to add new balls
- **Drag and throw**: Drag balls and release to throw them with velocity
- **Theme sync**: Canvas background syncs with the app's dark/light theme

### AI Control

The agent can manipulate the simulation through tools:

- Add/remove balls with specific properties (position, color, velocity)
- Clear all balls
- Adjust gravity strength and direction
- Change friction settings
- Pause/resume the simulation

This pattern shows how to build apps where users can interact directly with the UI while also asking the AI to make changes through natural language.

## Plan/Act Architecture

This template uses a simple two-mode architecture:

### 🎯 Plan Mode - _Strategy & Discussion_

- **Purpose**: Planning and strategy development without execution
- **What it does**: Task analysis, creating action plans, strategic discussions
- **Tools**: Limited to planning and analysis tools

### 🚀 Act Mode - _Execution & Operations_

- **Purpose**: Execute actions using available tools
- **What it does**: Performs concrete actions, manipulates state, runs operations
- **Tools**: Full access to execution tools (including ball simulation controls)

### Mode Switching

Switch modes anytime by typing the mode name:

- Type "plan" to switch to plan mode
- Type "act" to switch to act mode

The agent adapts its available tools and behavior based on the current mode.

## Stack

- **AI SDK v6** (`ai` ^6.0.x) with `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`
- **Cloudflare AI Chat** (`@cloudflare/ai-chat` ^0.0.3) for `useAgentChat` hook
- React Router v7 (SSR + hydration) with `@react-router/dev/vite`
- Cloudflare Workers glue in `src/worker.ts` (agents routing + API endpoints)
- Vite + `@cloudflare/vite-plugin` + `@tailwindcss/vite` + `vite-tsconfig-paths`
- Tailwind CSS v4 (use `@import "tailwindcss";` in `src/styles.css`)

Key files:

- `app/entry.client.tsx`, `app/entry.server.tsx`, `app/root.tsx`, `app/routes.ts`
- `app/routes/_index.tsx`, `app/routes/auth.callback.tsx`
- `src/worker.ts` (handles `/api/oauth/config`, `/api/oauth/token`, `/api/user/info`, then falls through to React Router)

Hydration safety:

- `<meta charSet="utf-8" />` + server `Content-Type: text/html; charset=utf-8`
- Pre-hydration theme script in `app/root.tsx` sets `dark/light` to avoid mismatches
- `suppressHydrationWarning` only on `<html>`

## Prerequisites

- **Cloudflare Account**
- **OpenAI API key** (or access to [AI@YourService](https://atyourservice.ai) Gateway)

### Authentication Options

This template uses **AI@YourService** for user authentication by default, but you have flexibility in your authentication approach:

#### Option 1: Full AI@YourService Integration (As implemented)

- Use AI@YourService for both user authentication and LLM Gateway access
- Users pay for their own AI usage through their AI@YourService account
- Seamless integration with built-in billing and usage tracking

#### Option 2: Custom Authentication + AI@YourService Gateway

- Implement your own user authentication system
- Still use AI@YourService OAuth flow for LLM Gateway authentication
- Users connect their AI@YourService account for AI usage billing
- You maintain control over user management while leveraging AI@YourService for AI costs

#### Option 3: Fully Custom

- Implement your own authentication and AI provider integration
- You handle all billing and usage management

> **💡 Recommended Approach**: Use AI@YourService OAuth for the LLM Gateway even with custom auth, so users pay for their own AI usage rather than you absorbing those costs.

## Quick Start (dev)

1. Install dependencies:

```bash
pnpm install
```

2. Set up your environment:

Create a `.dev.vars` file based on `.dev.vars.example`

3. Run locally (ports: 5273 for this demo):

```bash
pnpm run dev
```

## Deployment

The project supports three deployment environments, each with its own configuration as defined in `wrangler.jsonc`:

### Development (dev)

- **Purpose**: Local development and automated testing deployments
- **Configuration**: Uses the default configuration in `wrangler.jsonc`
- **Environment Variables**:
  - `SETTINGS_ENVIRONMENT`: "dev"
- **Usage**:
  - For local development: `pnpm run dev`
- **Deployment**:
  - Automatically deployed on Git push to branch `dev` to enable CI/CD testing
  - Optional manual deployment:
  ```bash
  pnpm run deploy
  ```

### Staging/Preview

- **Purpose**: Testing changes before production deployment
- **Configuration**: Uses the `staging` environment in `wrangler.jsonc`
- **Environment Variables**:
  - `SETTINGS_ENVIRONMENT`: "staging"
- **Domain**: `staging.appagent.dev`
- **Deployment**:
  - Automatically deployed on Git push to branch `dev` to enable CI/CD testing
  - Optional manual deployment:
  ```bash
  pnpm run deploy:staging
  ```

### Production

- **Purpose**: Live production environment
- **Configuration**: Uses the `production` environment in `wrangler.jsonc`
- **Environment Variables**:
  - `SETTINGS_ENVIRONMENT`: "production"
- **Domain**: `appagent.dev`
- **Deployment**:
  - Automatically deployed on Git push to branch `main` to enable CI/CD testing
  - Optional manual deployment:
  ```bash
  pnpm run deploy:production
  ```

### OAuth notes

- Client fetches config from `/api/oauth/config` which returns `token_url: /api/oauth/token`
- The Worker exchanges the code server-side at `/api/oauth/token` (avoids browser CORS and keeps secrets server-side)

## Project Structure

```
├── src/
│   ├── app.tsx        # Main app with chat UI
│   ├── server.ts      # Server-side agent logic
│   ├── styles.css     # Tailwind CSS styling
│   ├── balls/         # PixiJS ball simulation
│   │   ├── BallCanvas.tsx       # React wrapper component
│   │   ├── BallRenderer.ts      # PixiJS renderer with physics
│   │   └── types.ts             # Ball and state types
│   └── agent/         # Agent implementation
│       ├── AppAgent.ts          # Main agent class
│       ├── tools/               # Tool definitions
│       │   ├── balls.ts         # Ball simulation tools
│       │   └── ...              # Other tools
│       ├── utils/
│       │   ├── export-import-utils.ts  # Export/import functionality
│       │   └── tool-utils.ts    # Tool utility functions
│       ├── types/               # Type definitions
│       └── storage/             # Data persistence layer
├── docs/
│   ├── MIGRATION.md             # AI SDK v4 to v6 migration guide
│   └── VOICE.md                 # Voice input documentation
```

## Customization Guide

### Adding New Tools

Add new tools in `src/agent/tools/` using AI SDK v6's `tool` function:

```typescript
import { tool } from "ai";
import { z } from "zod";

// Example of an auto-executing tool
export const getCurrentTime = tool({
  description: "Get current server time",
  parameters: z.object({}),
  execute: async () => new Date().toISOString()
});

// Example of a tool that requires confirmation (no execute function)
export const searchDatabase = tool({
  description: "Search the database for user records",
  parameters: z.object({
    query: z.string(),
    limit: z.number().optional()
  })
  // No execute function = requires human confirmation
});
```

All tools are wrapped with error handling in `src/agent/tools/registry.ts`:

```typescript
import { wrapToolWithErrorHandling } from "./wrappers";

export const tools = {
  getCurrentTime: wrapToolWithErrorHandling(getCurrentTime),
  searchDatabase: wrapToolWithErrorHandling(searchDatabase)
};
```

To handle tool confirmations, add execution functions to the `executions` object:

```typescript
export const executions = {
  searchDatabase: async ({
    query,
    limit
  }: {
    query: string;
    limit?: number;
  }) => {
    const results = await db.search(query, limit);
    return results;
  }
};
```

Tools can be configured in two ways:

1. With an `execute` function for automatic execution
2. Without an `execute` function, requiring confirmation and using the `executions` object to handle the confirmed action

### Error Handling

The template uses AI SDK v6's error handling pattern with the `useAgentChat` hook from `@cloudflare/ai-chat/react`:

```typescript
import { useAgentChat } from "@cloudflare/ai-chat/react";

// The hook returns an error state
const {
  messages,
  error: chatError,
  setMessages
} = useAgentChat({
  agent,
  // onError is for logging only, not for modifying messages
  onError: (error) => console.error("Chat error:", error)
});

// Handle errors via useEffect watching the error state
useEffect(() => {
  if (!chatError) return;

  // Add error message to chat
  const errorMessage = {
    id: crypto.randomUUID(),
    role: "assistant" as const,
    parts: [{ type: "text" as const, text: `__ERROR__: ${chatError.message}` }]
  };
  setMessages((prev) => [...prev, errorMessage]);
}, [chatError, setMessages]);
```

**Key Points:**

- Use the `error` state from the hook, not `onError` callback for message updates
- Error messages use `__ERROR__` prefix format for identification
- Tool invocation cards show "Executing..." state while tools are running

### Modifying the UI

The chat interface is built with React and can be customized in `app.tsx`:

- Modify the theme colors in `styles.css`
- Add new UI components in the chat container
- Customize message rendering and tool confirmation dialogs
- Add new controls to the header

## Data Export and Import

The agent includes built-in functionality for data export and import, allowing you to back up and restore the agent's state, messages, and database tables.

### Exporting Agent Data

You can create a complete backup of an agent by accessing the export endpoint:

```bash
# Export agent data to a JSON file
curl -X GET "http://localhost:5173/agents/foo-agent/my-agent/export" \
  -H "Content-Type: application/json" \
  --output agent-backup.json
```

The exported data includes:

- Current agent state (metadata.state)
- Database schema and data in a structured format (tables)
- Message history (stored in the cf_ai_chat_agent_messages table)
- Scheduled tasks (stored in the cf_agents_schedules table)
- Custom database tables (companies, leads, interaction history, etc.)

#### Export File Structure

The export file is structured as a JSON object with the following top-level keys:

- `metadata`: Contains export timestamp, agent ID, and current state
- `tables`: Contains all database tables with their schema and data

Messages are stored within the database tables section rather than as a separate array. If examining an export file, you'll find messages in the `cf_ai_chat_agent_messages` table.

#### Getting Just Messages

If you only need the message history, you can use the `get-messages` endpoint:

```bash
# Get only message history
curl -X GET "http://localhost:5173/agents/foo-agent/my-agent/get-messages" \
  -H "Content-Type: application/json" \
  --output agent-messages.json
```

### Importing Agent Data

To restore an agent from a previously exported backup:

```bash
# Import a backup file
curl -X POST "http://localhost:5173/agents/foo-agent/new-agent/import" \
  -F "file=@agent-backup.json" \
  -F "includeMessages=true" \
  -F "includeScheduledTasks=true"
```

Import options:

- `includeMessages` (default: true) - Whether to import message history
- `includeScheduledTasks` (default: true) - Whether to import scheduled tasks
- `preserveAgentId` (default: false) - Whether to preserve the original agent ID

This functionality is useful for:

- Creating a new agent instance with existing data
- Migrating data between agents
- Creating backups before major changes
- Recovering from data loss

## Usage Example

Here's how to interact with the ball simulation using natural language:

### Plan Mode - Discuss Strategy

```
User: "plan"
Agent: Switches to plan mode

User: "I want to create an interesting visual with the balls"
Agent: Suggests ideas like:
- Creating a pattern with specific ball positions
- Using gravity changes for dynamic effects
- Color-coding balls for visual organization
```

### Act Mode - Execute Commands

```
User: "act"
Agent: Switches to act mode (full tool access)

User: "Add 5 red balls in a row at the top"
Agent: Uses addBall tool to create balls with:
- Positions spaced evenly at the top
- Red color (0xff0000)
- Initial downward velocity

User: "Make gravity pull to the left"
Agent: Uses setGravityAngle tool to change gravity direction

User: "Clear everything and start fresh"
Agent: Uses clearBalls tool to reset the simulation
```

## Building Your Own App Agent

This template demonstrates the pattern for any app agent:

1. **Create your UI state** (like the ball simulation)
2. **Expose state to the agent** via tools in `src/agent/tools/`
3. **Let users interact directly** with the UI
4. **Let the AI control state** through natural language

Example use cases you could build:

- **Data visualization agent** - AI helps create and modify charts
- **Form builder agent** - AI assists in creating form layouts
- **Game agent** - AI controls game elements or provides hints
- **Design tool agent** - AI helps with color schemes, layouts

## Composio Integration

This agent includes integration with [Composio](https://composio.dev), which provides a way to connect the agent with various external services including Google, GitHub, Notion, and more.

### Setting Up Composio

1. Create a Composio account at [composio.dev](https://composio.dev)
2. Get your API key from the Composio dashboard
3. Add it to your `.dev.vars` file:

```
COMPOSIO_API_KEY=your-api-key-here
```

### How Composio Works

Composio provides a simple way to add third-party integrations to your agent:

- The agent's tool processor automatically detects and handles Composio tool calls
- Composio tools are processed using the `handleToolCall` function from the Composio SDK
- All results are automatically integrated back into the agent's conversation flow

### Available Services

By default, the integration includes the "googlesuper" app, which provides access to Gmail, Google Calendar, and other Google services. To add support for other apps, modify the `composioTools` export in `src/agent/tools/composio.ts`:

```typescript
// To support multiple apps:
export const composioTools = await toolset.getTools({
  apps: ["googlesuper", "github", "notion"]
});
```

### Usage Examples

Users can interact with Composio tools through natural language:

```
Send an email to john@example.com with the subject "Meeting" and body "Can we meet tomorrow at 2pm?"

Star the GitHub repository "composiohq/composio"

Create a new page in Notion titled "Project Plan"
```

See the [Composio documentation](https://docs.composio.dev) for a complete list of supported apps and capabilities.

## Learn More

- [`agents`](https://github.com/cloudflare/agents/blob/main/packages/agents/README.md)
- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## License

MIT

## Secret word for agents

AppAgent
