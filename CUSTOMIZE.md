# Customizing the App Agent Template

This template provides a robust foundation for building AI-powered applications with conversational interfaces. This guide shows you how to customize it for your specific use case while building on the existing architecture.

## Overview

The template includes:

- **Agent Framework**: Multi-mode AI agent with tool integration
- **Chat Interface**: Real-time conversational UI with message history
- **State Management**: Persistent state via Cloudflare Durable Objects
- **Authentication**: OAuth integration with AtYourService.ai
- **Tool System**: Extensible tools including Composio integrations
- **UI Components**: Responsive React components with Tailwind CSS

## Quick Start

Before customizing the agent behavior, you need to set up the basic project infrastructure:

1. **Copy template** → **Update metadata** → **Configure OAuth** → **Set ports** → **Test basic setup**
2. Then customize agent behavior, UI, and tools for your specific use case

See the detailed steps below, or follow the [Getting Started](#getting-started) section in the README.

## Customization Steps

### 1. Project Setup and Basic Configuration

#### 1.1 Clone Template and Set Up New Repository

```bash
# Clone the app-agent-template repository
git clone git@github.com:atyourserviceai/app-agent-template.git your-project-name
cd your-project-name

# Rename the template origin to keep it as reference
git remote rename origin template

# Create a new repository on GitHub/GitLab for your project
# Then add it as the new origin
git remote add origin git@github.com:yourusername/your-project-name.git

# Verify remotes are set correctly
git remote -v
# Should show:
# origin    git@github.com:yourusername/your-project-name.git (fetch)
# origin    git@github.com:yourusername/your-project-name.git (push)
# template  git@github.com:atyourserviceai/app-agent-template.git (fetch)
# template  git@github.com:atyourserviceai/app-agent-template.git (push)
```

This setup allows you to:

- **Pull template updates**: `git pull template main` to get latest template improvements
- **Push your changes**: `git push origin main` to your project repository
- **Maintain clean history**: Your project starts with the full template history

> **Note**: After making your initial customizations, commit and push to your new repository:
>
> ```bash
> git add .
> git commit -m "Initial customization: update metadata, ports, and OAuth config"
> git push -u origin main
> ```

#### 1.2 Update Package Metadata

**File: `package.json`**

```json
{
  "name": "your-project-name",
  "description": "Your project description with clear value proposition",
  "keywords": ["relevant", "keywords", "for", "your", "use-case"],
  "author": "Your Name",
  "scripts": {
    "dev": "react-router dev --port XXXX",
    "preview": "vite preview --port XXXX"
  }
}
```

**File: `wrangler.jsonc`**

```jsonc
{
  "name": "your-project-agent",
  "vars": {
    "ATYOURSERVICE_OAUTH_REDIRECT_URI": "http://localhost:XXXX/auth/callback"
  },
  "dev": {
    "port": 8XXX,
    "inspector_port": 9XXX
  },
  "env": {
    "staging": {
      "vars": {
        "ATYOURSERVICE_OAUTH_REDIRECT_URI": "https://staging.yourproject.com/auth/callback"
      },
      "routes": [
        {
          "pattern": "staging.yourproject.com",
          "custom_domain": true
        }
      ]
    },
    "production": {
      "vars": {
        "ATYOURSERVICE_OAUTH_REDIRECT_URI": "https://yourproject.com/auth/callback"
      },
      "routes": [
        {
          "pattern": "yourproject.com",
          "custom_domain": true
        }
      ]
    }
  }
}
```

**File: `vite.config.ts`**

```typescript
export default defineConfig({
  plugins: [
    cf({
      inspectorPort: 9XXX // Match wrangler.jsonc inspector_port
    }),
    // ... other plugins
  ],
  server: {
    port: XXXX, // Match package.json dev port
    strictPort: true
  }
});
```

> **Port Selection**: Choose unique ports that don't conflict with other demos. See the [demos README](../README.md) for current port assignments.

#### 1.3 Create OAuth Applications

You need to create OAuth applications in AI@YourService for each environment:

1. **Go to AI@YourService Dashboard**: Navigate to OAuth Apps section
2. **Create Development App**:
   - Name: `your-project-name-dev`
   - Callback URL: `http://localhost:XXXX/auth/callback`
   - Note the Client ID and Secret
3. **Create Staging App**:
   - Name: `your-project-name-staging`
   - Callback URL: `https://staging.yourproject.com/auth/callback`
4. **Create Production App**:
   - Name: `your-project-name-production`
   - Callback URL: `https://yourproject.com/auth/callback`

#### 1.4 Configure OAuth Secrets

**Development Environment** (`.dev.vars` file):

```bash
# Copy the example and update with your credentials
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```
ATYOURSERVICE_OAUTH_CLIENT_ID=your-dev-client-id
ATYOURSERVICE_OAUTH_CLIENT_SECRET=your-dev-client-secret
BROWSERBASE_API_KEY=your-browserbase-api-key  # Optional
COMPOSIO_API_KEY=your-composio-api-key        # Optional
```

**Staging Environment**:

```bash
wrangler secret put ATYOURSERVICE_OAUTH_CLIENT_ID --env staging
wrangler secret put ATYOURSERVICE_OAUTH_CLIENT_SECRET --env staging
```

**Production Environment**:

```bash
wrangler secret put ATYOURSERVICE_OAUTH_CLIENT_ID --env production
wrangler secret put ATYOURSERVICE_OAUTH_CLIENT_SECRET --env production
```

#### 1.5 Test Basic Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Visit http://localhost:XXXX and test OAuth login
```

You should be able to:

- ✅ Access the app at your configured port
- ✅ Click "Sign in with AI@YourService"
- ✅ Complete OAuth flow and return to the app
- ✅ See the default agent interface

### 2. Customize Agent Behavior

#### 2.1 Update System Prompt

**File: `src/agent/prompts/unified.ts`**

Replace the generic prompt with your domain-specific instructions:

```typescript
export function getUnifiedSystemPrompt(): string {
  return `You are [YourAgentName], an AI assistant specialized in [your domain].

## YOUR CORE MISSION
[Describe what your agent does and the value it provides]

## KEY CAPABILITIES
- [Capability 1]
- [Capability 2]
- [Capability 3]

## INTERACTION GUIDELINES
[Specific instructions for how the agent should behave]

## DOMAIN-SPECIFIC KNOWLEDGE
[Add any specialized knowledge or context your agent needs]

[Keep the existing mode system and tool instructions below...]`;
}
```

#### 3.2 Add Domain-Specific Types

**File: `src/agent/AppAgent.ts`**

Add your custom types after the existing types:

```typescript
// Your custom types for domain-specific data
export interface YourDataType {
  id: string;
  // your fields
}

// Extend AppAgentState with your data
export interface AppAgentState {
  mode: AgentMode;
  // ... existing fields ...

  // Your custom state fields
  yourCustomData?: YourDataType;
  yourProgress?: {
    currentStep: number;
    isComplete: boolean;
  };
}
```

### 4. Add Custom Tools

#### 4.1 Composio Integrations

**File: `src/agent/tools/composio.ts`**

Add tools for your specific integrations:

```typescript
import { VercelAIToolSet } from "composio-core";

// Add your domain-specific Composio tools
export const getYourDomainTools = async () => {
  const toolset = new VercelAIToolSet();
  return await toolset.getTools({
    apps: ["your-integration", "another-integration"]
  });
};
```

#### 4.2 Custom Tools

**File: `src/agent/tools/your-domain.ts`**

Create domain-specific tools using AI SDK v6's `tool` function:

```typescript
import { tool } from "ai";
import { z } from "zod";

export const yourCustomTool = tool({
  description: "Description of what this tool does",
  parameters: z.object({
    input: z.string().describe("Input parameter description")
  }),
  execute: async ({ input }) => {
    // Your tool logic here
    const result = await performYourOperation(input);
    return `Result message: ${result}`;
  }
});

// Tool requiring human approval (no execute function)
export const sensitiveAction = tool({
  description: "Performs a sensitive action that requires user approval",
  parameters: z.object({
    target: z.string().describe("Target of the action")
  })
  // No execute = requires confirmation
});
```

**Note:** AI SDK v6 tools receive only the parameters object in `execute`. Agent state access should be handled at a higher level if needed.

#### 4.3 Register New Tools

**File: `src/agent/tools/registry.ts`**

Add your tools to the registry with error handling:

```typescript
import * as rawYourDomainTools from "./your-domain";
import { wrapAllToolsWithErrorHandling } from "./wrappers";

// Wrap all tools with error handling
export const yourDomainTools = wrapAllToolsWithErrorHandling(rawYourDomainTools);

// Add to the tools object
export const tools = {
  // ... existing tools ...
  yourCustomTool: yourDomainTools.yourCustomTool,
  sensitiveAction: yourDomainTools.sensitiveAction,
};

// Add execution handlers for tools requiring approval
export const executions = {
  // ... existing executions ...
  sensitiveAction: async ({ target }: { target: string }) => {
    // Implementation when user approves
    return `Action performed on ${target}`;
  }
};
```

#### 4.4 Update Tool Access by Mode

**File: `src/agent/AppAgent.ts`**

Add your tools to the appropriate modes:

```typescript
async getToolsForMode() {
  const state = this.state as AppAgentState;
  const mode = state.mode;

  // Base tools + your domain tools
  const yourDomainTools = await getYourDomainTools();
  const baseTools = {
    // ... existing base tools ...
    yourCustomTool: tools.yourCustomTool,
    ...yourDomainTools,
  };

  switch (mode) {
    case "act":
      return {
        ...baseTools,
        // Add mode-specific tools
      } as ToolSet;
    // ... other modes
  }
}
```

### 5. Customize User Interface

#### 5.1 Update PresentationPanel

**File: `src/components/chat/PresentationPanel.tsx`**

Replace or enhance the content area:

```typescript
// Add your domain-specific data checks
const hasYourData = agentState?.yourCustomData;

// Add your custom UI sections
{hasYourData && (
  <Card className="p-4 bg-neutral-100 dark:bg-neutral-900">
    <h3 className="font-medium">Your Custom Section</h3>
    <YourCustomComponent data={agentState.yourCustomData} />
  </Card>
)}
```

#### 5.2 Create Custom Components

**File: `src/components/your-domain/YourComponent.tsx`**

```typescript
interface YourComponentProps {
  data: YourDataType;
}

export function YourComponent({ data }: YourComponentProps) {
  return (
    <div className="space-y-4">
      {/* Your custom UI */}
    </div>
  );
}
```

#### 5.3 Update Navigation and Branding

**File: `src/components/chat/ChatHeader.tsx`**

- Update app title and branding
- Add your logo or icon
- Customize header actions

### 6. Add Custom Workflows

#### 6.1 Multi-Step Processes

If your domain requires multi-step workflows:

```typescript
// In your system prompt
## WORKFLOW STAGES
1. **Initial Assessment**: [Description]
2. **Data Collection**: [Description]
3. **Analysis**: [Description]
4. **Recommendations**: [Description]

// In your agent state
yourProgress?: {
  stage: "assessment" | "collection" | "analysis" | "recommendations";
  currentStep: number;
  totalSteps: number;
  stageData: Record<string, unknown>;
}
```

#### 6.2 Progress Tracking

Create components to show workflow progress:

```typescript
export function WorkflowProgress({ progress }: { progress: YourProgressType }) {
  return (
    <div className="flex items-center space-x-2">
      {stages.map((stage, index) => (
        <div key={stage} className={`step ${index <= progress.currentStep ? 'completed' : ''}`}>
          {stage}
        </div>
      ))}
    </div>
  );
}
```

### 7. Data Validation

**File: `src/types/your-domain.ts`**

Create Zod schemas for your data:

```typescript
import { z } from "zod";

export const YourDataSchema = z.object({
  id: z.string()
  // your validation rules
});

export type YourDataType = z.infer<typeof YourDataSchema>;
```

### 8. Testing Your Customization

#### 8.1 Type Safety

```bash
npm run check
```

#### 8.2 Local Development

```bash
npm run dev
```

#### 8.3 Test Conversations

- Test your agent's new capabilities
- Verify state persistence
- Check tool integrations
- Validate UI updates

### 9. Deployment Configuration

**File: `wrangler.jsonc`**

Update environment variables for your integrations:

```json
{
  "name": "your-project-name",
  "vars": {
    "YOUR_CUSTOM_API_KEY": "your-value"
  }
}
```

## Best Practices

### 1. Build Incrementally

- Start with basic prompt customization
- Add one tool at a time
- Test each change before moving on

### 2. Maintain Existing Patterns

- Follow the existing code structure
- Use the same error handling patterns
- Keep the mode system unless you have specific needs

### 3. State Management

- Always update state through `agent.setState()`
- Use AppAgentState for persistent data
- Leverage automatic Durable Object persistence

### 4. UI Consistency

- Use existing Tailwind classes
- Follow the component structure pattern
- Maintain responsive design

### 5. Tool Design

- Make tools focused and single-purpose
- Include proper error handling
- Update agent state when appropriate
- Provide clear descriptions

## Example: Simple Customization

Here's a minimal example for a "Recipe Assistant" agent:

```typescript
// 1. Update prompt
return `You are ChefBot, an AI cooking assistant that helps users find and prepare recipes.`;

// 2. Add recipe type
interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
}

// 3. Add to state
currentRecipe?: Recipe;

// 4. Add recipe tool
export const findRecipe = {
  description: "Find a recipe based on ingredients",
  parameters: z.object({
    ingredients: z.array(z.string()),
  }),
  execute: async ({ ingredients }, { agent }) => {
    const recipe = await searchRecipes(ingredients);
    await agent.setState({
      ...agent.state,
      currentRecipe: recipe,
    });
    return `Found recipe: ${recipe.name}`;
  },
};

// 5. Add recipe display component
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Card>
      <h3>{recipe.name}</h3>
      <ul>{recipe.ingredients.map(ing => <li key={ing}>{ing}</li>)}</ul>
    </Card>
  );
}
```

## Getting Help

- Check the existing code for patterns and examples
- Look at the IdeaPotential demo for a complete customization example
- Review the Composio documentation for available integrations
- Test with the AtYourService.ai platform for authentication and credits

## Next Steps

After customization:

1. Test thoroughly in development
2. Deploy to staging environment
3. Gather user feedback
4. Iterate and improve
5. Deploy to production

Remember: The template is designed to be extended, not replaced. Build on the existing foundation to create powerful, domain-specific AI applications quickly and reliably.
