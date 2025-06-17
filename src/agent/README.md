# Agent Architecture

This directory contains the core agent implementations for the Base Agent system. The architecture is organized around a unified agent that can operate in different modes to handle specialized tasks.

## Directory Structure

- `/prompts`: System prompts for different agent modes
- `/tools`: Tool implementations for various capabilities
- `/utils`: Shared utilities for mode transitions, tool handling, etc.

## Agent Modes

The AppAgent can operate in multiple modes:

### Onboarding Mode

Interactive mode that helps users configure agent settings and initial setup. Restricted tool access for security during initial configuration.

### Integration Mode

Administrator mode for testing and documenting tools before using them in a production environment. Has access to all tools for testing purposes.

### Plan Mode

Planning and strategy mode that helps analyze tasks, break down complex problems, and create strategic approaches.

### Act Mode

Action execution mode for performing tasks, executing plans, and taking concrete actions. Has access to execution tools and external system integrations.

## Mode-Based Tool Access Control

The agent implements a strict tool access control system based on the current mode:

1. **Universal Tools**: Basic utilities available in all modes (weather, time, web browsing, scheduling, state retrieval)
2. **Mode-Specific Tools**: Each mode has access to specific tools appropriate for its function:
   - Onboarding Mode: Configuration tools + universal tools
   - Integration Mode: All tools (for testing purposes)
   - Plan Mode: Only universal tools
   - Act Mode: Execution tools + universal tools

## Unified System Prompt Architecture

Instead of using separate system prompts for each mode, the agent uses a unified system prompt approach:

1. **Comprehensive Tool Definitions**: All tools across all modes are fully defined in the system prompt, giving the LLM complete knowledge of all capabilities.
2. **Access Control Through Validation**: While all tools are defined in the system prompt, actual access is controlled through code-based validation.
3. **Mode Transitions via Conversation**: When changing modes, the agent injects a transition message into the conversation to clarify which mode is now active.
4. **State Retrieval on Demand**: The agent uses state retrieval tools to access relevant context for the current mode rather than embedding state in the system prompt.

This architecture provides several benefits:

- **Efficient Prompt Caching**: Uses a single static system prompt that doesn't change between modes, reducing token usage and improving LLM performance
- **Complete Tool Knowledge**: The LLM has access to all tool definitions at all times, even if it can't use all of them in the current mode
- **Clear Mode Boundaries**: Each mode clearly indicates which subset of tools can be used
- **Conversation Context**: Mode history is preserved in the conversation history
- **Runtime Security**: Prevents inappropriate tool usage based on the current mode through code validation

## State Management

Agents use two primary mechanisms for state management:

1. **SQLite Database**: Built-in SQL database for structured data storage
2. **Agent State**: JSON-based state for simpler, in-memory access
3. **State Retrieval Tools**: Tools that fetch specific state information on demand

## Tool Implementation

Tools are implemented in the `/tools` directory and organized by category. Each mode has access to a specific subset of tools based on its functionality and security requirements.

## Adding New Functionality

To extend the AppAgent with new capabilities:

1. **Add New Tools**:

   - Create tool implementations in the `/tools` directory
   - Update the appropriate tool collections in `tools/index.ts`
   - Add validation rules in `validateToolAccessForMode` function

2. **Add New Modes** (if needed):

   - Update the `AgentMode` type in `AppAgent.ts`
   - Add a new section in the unified system prompt
   - Create a transition message template for the new mode
   - Implement tool access rules for the new mode

3. **Extend State**:
   - Add new state fields to the `AppAgentState` interface
   - Update state retrieval tools to access the new fields
   - Implement tools to update the new state fields

## Testing and Validation

When implementing new features, ensure:

1. Tool access control is properly enforced for each mode
2. State is correctly preserved and retrieved
3. Mode transitions are handled smoothly
4. The unified system prompt is updated to explain new functionality
