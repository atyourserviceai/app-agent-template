# 🤖 App Agent Template

![app-agent-template-header](https://github.com/user-attachments/assets/2a15d027-18cf-419b-952b-659e047154d1)

<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/atyourserviceai/app-agent-template"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>

A starter template for building **app agents** using Cloudflare's Agent platform, powered by [`agents`](https://www.pnpmjs.com/package/agents). An app agent is a React application that has access to the agent's state, allowing you to build rich user interfaces around AI conversation.

Integrated with **[AI@YourService](https://atyourservice.ai)** for authentication and LLM Gateway access, so users pay for their own AI usage instead of you footing the bill.

Based on Cloudflare's [agents-starter](https://github.com/cloudflare/agents-starter) with additional features:

- Enhanced chat functionality (message editing, retrying, error handling)
- Improved error display and user feedback
- Four-mode agent architecture (onboarding/integration/plan/act)
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
- 🏗️ **Four-Mode System**: Setup phases (onboarding + integration) before operational phases (plan + act)
- 📋 **Saved Configuration**: Onboarding produces defaults and settings the agent operates with
- 💬 Interactive chat interface with AI
- ✏️ Enhanced chat functionality (edit messages, retry, error handling)
- 🛠️ Built-in tool system with human-in-the-loop confirmation
- 📅 Advanced task scheduling (one-time, delayed, and recurring via cron)
- 🔧 **Tool Validation & Testing**: Integration mode ensures reliable production deployments
- 🌓 Dark/Light theme support
- ⚡️ Real-time streaming responses
- 🔄 State management and chat history
- 🎨 Modern, responsive UI
- 🚀 Generic architecture for easy customization

## Four-Mode Architecture

This template uses a four-mode agent architecture that goes beyond typical plan/act agents. Unlike traditional coding agents that only have planning and execution phases, this approach includes **setup phases** before operational use:

### The Four Modes & Workflow

#### 1. **🎯 Onboarding Mode** - _Agent Owner Configuration_

- **Purpose**: Define the agent's goals, methodology, and operating configuration
- **Who uses it**: The agent owner/primary stakeholder (one-time setup)
- **What it does**: Conducts an interactive interview to document:
  - What the agent should accomplish
  - How it should approach tasks
  - Company-specific processes and methodologies
  - Success criteria and best practices
- **Output**: Saved configuration and defaults used in future sessions (e.g., preferences, operators, guardrails)

#### 2. **🔧 Integration Mode** - _Developer/Admin Setup_

- **Purpose**: Configure and test the tools needed to achieve the defined goals
- **Who uses it**: Agent developers and system administrators
- **What it does**:
- Analyzes the onboarding configuration to identify required tools
  - Guides integration setup for external services
  - Tests tool functionality before production use
  - Documents working integrations
- **Output**: Validated, documented tool ecosystem

#### 3. **🎯 Plan Mode** - _Strategy & Discussion_

- **Purpose**: Planning and strategy development without execution
- **Who uses it**: End users for strategic thinking
- **What it does**: Task analysis, creating action plans, strategic discussions
- **Tools**: No execution tools - pure planning and analysis

#### 4. **🚀 Act Mode** - _Execution & Operations_

- **Purpose**: Execute actions using the established configuration and tools
- **Who uses it**: End users for day-to-day operations
- **What it does**: Performs concrete actions guided by saved configuration and plans
- **Tools**: Full access to execution tools

### Why This Architecture Works

Most AI agents jump straight into plan/act cycles without proper foundation. This approach ensures:

1. **Clear Purpose Definition**: Onboarding captures the "why" and "how" before building
2. **Reliable Tool Setup**: Integration mode prevents production failures
3. **Persisted Configuration**: Onboarding choices become default operating configuration
4. **Scalable Operations**: Multiple users can operate the agent consistently

### Natural Progression Flow

```
Onboarding → Integration → Plan ⟷ Act
    ↓            ↓          ↓      ↓
 Define       Set up    Discuss Execute
 Goals        Tools     Strategy Actions
```

The agent automatically adapts its behavior, available tools, and responses based on the current mode, ensuring users get the right capabilities at the right time.

### Getting Started with the Four-Mode Workflow

1. **Start with Onboarding**: Begin by switching to onboarding mode to define your agent's purpose and methodology
2. **Configure Integrations**: Use integration mode to set up and test any external tools or services needed
3. **Plan & Execute**: Use plan mode for strategy and act mode for execution in daily operations

**Quick Mode Switching**: You can switch modes anytime by typing just the mode name:

- Type "onboarding" to switch to onboarding mode
- Type "integration" to switch to integration mode
- Type "plan" to switch to plan mode
- Type "act" to switch to act mode

## Stack

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
│   ├── app.tsx        # Chat UI implementation
│   ├── server.ts      # Chat agent logic
│   ├── styles.css     # UI styling
│   └── agent/         # Agent implementation
│       ├── AppAgent.ts          # Main agent class
│       ├── tools/                # Tool definitions
│       ├── prompts/              # System prompts
│       ├── utils/
│       │   ├── export-import-utils.ts  # Export/import functionality
│       │   └── tool-utils.ts      # Tool utility functions
│       ├── types/                # Type definitions
│       │   └── generic.ts        # Generic type definitions
│       └── storage/              # Data persistence layer
│           ├── entities.ts       # Generic entity storage
│           └── history.ts        # Interaction history
├── docs/
│   └── agent-export-import.md  # Documentation for export/import functionality
```

## Customization Guide

### Adding New Tools

Add new tools in `tools.ts` using the tool builder:

```typescript
// Example of a tool that requires confirmation
const searchDatabase = tool({
  description: "Search the database for user records",
  parameters: z.object({
    query: z.string(),
    limit: z.number().optional()
  })
  // No execute function = requires confirmation
});

// Example of an auto-executing tool
const getCurrentTime = tool({
  description: "Get current server time",
  parameters: z.object({}),
  execute: async () => new Date().toISOString()
});

// Scheduling tool implementation
const scheduleTask = tool({
  description:
    "schedule a task to be executed at a later time. 'when' can be a date, a delay in seconds, or a cron pattern.",
  parameters: z.object({
    type: z.enum(["scheduled", "delayed", "cron"]),
    when: z.union([z.number(), z.string()]),
    payload: z.string()
  }),
  execute: async ({ type, when, payload }) => {
    // ... see the implementation in tools.ts
  }
});
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
    // Implementation for when the tool is confirmed
    const results = await db.search(query, limit);
    return results;
  }
  // Add more execution handlers for other tools that require confirmation
};
```

Tools can be configured in two ways:

1. With an `execute` function for automatic execution
2. Without an `execute` function, requiring confirmation and using the `executions` object to handle the confirmed action

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

## Four-Mode Workflow Example

Here's how to use the four-mode architecture to build a customer support agent:

### 1. Onboarding Mode - Define Purpose & Methodology

```
User: "onboarding"
Agent: Switches to onboarding mode

User: "I want to create a customer support agent"
Agent: Interviews you about:
- What types of customer issues you handle
- Your support process and escalation procedures
- Response time goals and quality standards
- Knowledge base and FAQ structure
- Communication preferences (email, chat, etc.)

Output: Saved configuration stored for future operation
```

### 2. Integration Mode - Set Up & Test Tools

```
User: "integration"
Agent: Switches to integration mode

Agent: Analyzes your configuration and identifies needed tools:
- Ticket system integration (Zendesk, Freshdesk, etc.)
- Knowledge base search
- Customer database lookup
- Email template system
- Escalation notification system

Agent: Guides you through testing each integration and documents working tools
Output: Validated, documented tool ecosystem
```

### 3. Plan Mode - Strategic Support Planning

```
User: "plan"
Agent: Switches to plan mode (no execution tools)

User: "Help me plan a strategy for reducing response times"
Agent: Analyzes your support data and suggests:
- Automation opportunities based on common issues
- Knowledge base improvements
- Process optimizations
- Performance metrics to track

Output: Strategic plan for implementation
```

### 4. Act Mode - Execute Support Operations

```
User: "act"
Agent: Switches to act mode (full tool access)

Agent: Actively handles support operations:
- Processes incoming tickets using your documented methodology
- Searches knowledge base for solutions
- Drafts responses using your templates
- Escalates complex issues per your procedures
- Tracks metrics and suggests improvements

Output: Executed support actions using your configured settings
```

## Example Use Cases

This four-mode architecture works for any domain:

1. **Customer Support Agent** (as shown above)
2. **Sales CRM Agent** (see superfans demo)
3. **Development Assistant**
4. **Data Analysis Assistant**
5. **Personal Productivity Assistant**
6. **Project Management Agent**

Each use case follows the same pattern:

1. **Onboarding**: Define goals, methodology, and success criteria
2. **Integration**: Set up and test required tools and services
3. **Plan**: Strategic thinking and analysis without execution
4. **Act**: Execute tasks using the established playbook and tools

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
