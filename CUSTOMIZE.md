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

## Customization Steps

### 1. Project Setup

```bash
# Copy the template to your new project
cp -r packages/demos/app-agent-template packages/demos/your-project-name
cd packages/demos/your-project-name
```

### 2. Update Package Configuration

**File: `package.json`**

```json
{
  "name": "your-project-name",
  "description": "Your project description",
  "keywords": ["your", "keywords", "here"],
  "author": "Your Name"
}
```

**File: `README.md`**

- Update project title and description
- Add your specific setup instructions
- Document your use case and features

### 3. Customize Agent Behavior

#### 3.1 Update System Prompt

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
// Add your domain-specific Composio tools
export const getYourDomainTools = async () => {
  const toolset = new VercelAIToolSet();
  return await toolset.getTools({
    apps: ["your-integration", "another-integration"],
  });
};
```

#### 4.2 Custom Tools

**File: `src/agent/tools/your-domain.ts`**

Create domain-specific tools:

```typescript
import { generateObject, generateText } from "ai";
import { z } from "zod";

export const yourCustomTool = {
  description: "Description of what this tool does",
  parameters: z.object({
    input: z.string().describe("Input parameter description"),
  }),
  execute: async ({ input }, { agent }) => {
    // Your tool logic here
    const result = await performYourOperation(input);

    // Update agent state if needed
    const currentState = agent.state as AppAgentState;
    await agent.setState({
      ...currentState,
      yourCustomData: result,
    });

    return `Result message: ${result}`;
  },
};
```

#### 4.3 Register New Tools

**File: `src/agent/tools/registry.ts`**

Add your tools to the registry:

```typescript
import { yourCustomTool } from "./your-domain";
import { getYourDomainTools } from "./composio";

// Add to the tools object
export const tools = {
  // ... existing tools ...
  yourCustomTool: withErrorHandling(yourCustomTool),
};

// Add to executions if needed
export const executions = {
  // ... existing executions ...
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
  id: z.string(),
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
