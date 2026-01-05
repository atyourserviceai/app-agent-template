import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { UIMessage } from "ai";
// import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { AgentContext, Connection, Schedule } from "agents";
import { AIChatAgent } from "@cloudflare/ai-chat";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  convertToModelMessages,
  generateId,
  type StreamTextOnFinishCallback,
  streamText,
  type ToolSet,
  stepCountIs
} from "ai";
import { getSystemPrompt } from "./prompt";
import { executions, tools } from "./tools/registry";
import { simulateThinkingLLM } from "./middleware/simulateThinkingMiddleware";
import type { AdminContact, Operator } from "./types/generic";
import type { BallState } from "../balls/types";
import {
  type DatabaseExportResult,
  exportAgentData,
  type ImportRequest,
  importAgentData
} from "./utils/export-import-utils";
import { processToolCalls } from "./utils/tool-utils";
import { ShareAssetGenerator } from "../services/share-asset-generator";

// AI @ Your Service Gateway configuration for OpenAI (kept for reference)
// Using openai-compatible provider to disable stream_options.include_usage
// which the gateway doesn't support
const _getOpenAI = (env: Env, apiKey?: string) => {
  if (!apiKey) {
    throw new Error("API key is required for AI requests");
  }
  return createOpenAICompatible({
    name: "openai-gateway",
    apiKey: apiKey,
    baseURL: `${env.GATEWAY_BASE_URL}/v1/openai`,
    includeUsage: false // Disable stream_options.include_usage
  });
};

// AI @ Your Service Gateway configuration for Anthropic
const getAnthropic = (env: Env, apiKey?: string) => {
  if (!apiKey) {
    throw new Error("API key is required for AI requests");
  }
  return createAnthropic({
    apiKey: apiKey,
    baseURL: `${env.GATEWAY_BASE_URL}/v1/anthropic`
  });
};

/*
// AI @ Your Service Gateway configuration for Gemini
const getGemini = (env: Env, apiKey?: string) => {
  if (!apiKey) {
    throw new Error("API key is required for AI requests");
  }
  return createGoogleGenerativeAI({
    apiKey: apiKey,
    baseURL: `${env.GATEWAY_BASE_URL}/v1/google-ai-studio`,
  });
};
*/

// Helper function to filter out empty messages for AI provider compatibility
const filterEmptyMessages = (messages: UIMessage[]) => {
  return messages.filter((message, index) => {
    // Allow empty parts only for the final assistant message
    const isLastMessage = index === messages.length - 1;
    const isAssistant = message.role === "assistant";
    // In AI SDK v6, messages have 'parts' instead of 'content'
    const hasEmptyParts = !message.parts || message.parts.length === 0;

    // Keep the message if it has parts, or if it's the final assistant message
    return !hasEmptyParts || (isLastMessage && isAssistant);
  });
};

// Function to get a detailed error message
export function getErrorMessage(error: unknown): string {
  if (error == null) {
    return "unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error);
}

// Agent operating modes (simplified: only plan and act)
export type AgentMode = "plan" | "act";

// Define AppAgentState interface for proper typing
export interface AppAgentState {
  mode: AgentMode;
  settings?: {
    language: string; // Main language for the agent (e.g., "en", "es", "fr")
    operators: Operator[];
    adminContact: AdminContact;
    currentUser?: string; // ID of the current operator
  };

  // User authentication info (from OAuth)
  userInfo?: {
    id: string;
    email: string;
    credits: number;
    payment_method: string;
    // JWT API key removed - now stored only in SQLite
  };

  // Ball simulation state
  ballState?: BallState;

  // Optional metadata
  _lastModeChange?: string;
}

/**
 * Generic Agent implementation with multiple operational modes
 * Can operate as a planning assistant, action executor, or general purpose agent
 */
export class AppAgent extends AIChatAgent<Env> {
  // Store the internal agent ID
  agentId: string;

  // Define initial agent state including the current mode
  initialState: AppAgentState = {
    mode: "act" as AgentMode, // Default to act mode
    settings: {
      adminContact: {
        email: "",
        name: ""
      },
      language: "en",
      operators: []
    }
  };

  // Ensure the current state matches the latest schema, merging in any missing fields
  ensureStateSchema(inputState: AppAgentState | undefined): AppAgentState {
    // Create a local copy of the state to avoid parameter reassignment
    const state = inputState ? { ...inputState } : ({} as AppAgentState);

    // Always ensure a valid mode is set (only plan and act are valid)
    if (!state || !state.mode || !["plan", "act"].includes(state.mode)) {
      console.log(
        "[AppAgent] No valid mode found in state, defaulting to act mode"
      );
      state.mode = "act";
    }

    // Ensure settings exists
    if (!state.settings) {
      state.settings = this.initialState.settings;
    } else {
      // Merge settings properties
      if (!state.settings.language)
        state.settings.language = this.initialState.settings?.language || "en";
      if (!state.settings.operators)
        state.settings.operators = this.initialState.settings?.operators || [];
      if (!state.settings.adminContact)
        state.settings.adminContact = this.initialState.settings
          ?.adminContact || { email: "", name: "" };
    }

    return state;
  }

  constructor(ctx: AgentContext, env: Env) {
    super(ctx, env);

    // Store the ctx ID for reference
    this.agentId = ctx.id.toString();

    console.log(`[AppAgent] Initialized with internal ID: ${this.agentId}`);

    // Load initial state and ensure schema
    const state = this.state as AppAgentState;
    const updatedState = this.ensureStateSchema(state);
    this.setState(updatedState);

    // Initialize database tables and load user info
    this.initialize()
      .then(() => {
        // Only load user info after database is initialized
        return this.loadUserInfo();
      })
      .catch((error) => {
        console.error(
          "Failed to initialize database or load user info:",
          error
        );
      });
  }

  /**
   * Get JWT token from centralized UserDO (secure method)
   * @returns JWT token string or null if not found
   */
  private async getJWTFromUserDO(): Promise<string | null> {
    try {
      const state = this.state as AppAgentState;
      const userId = state.userInfo?.id;

      console.log(`[AppAgent] getJWTFromUserDO called for user: ${userId}`);
      console.log(
        `[AppAgent] Current state:`,
        JSON.stringify({
          userInfo: state.userInfo,
          hasUserInfo: !!state.userInfo,
          userId: userId
        })
      );

      if (!userId) {
        console.error(
          "[AppAgent] No user ID available to fetch JWT from UserDO"
        );
        return null;
      }

      // Fetch JWT from centralized UserDO
      console.log(
        `[AppAgent] Fetching JWT from centralized UserDO for user: ${userId}`
      );

      const userDOId = this.env.UserDO.idFromName(userId);
      const userDO = this.env.UserDO.get(userDOId);

      console.log(`[AppAgent] UserDO ID: ${userDOId.toString()}`);

      const response = await userDO.fetch(
        new Request(`https://user-do/get-jwt`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        })
      );

      console.log(`[AppAgent] UserDO response status: ${response.status}`);

      if (response.ok) {
        const data = (await response.json()) as { api_key?: string };

        if (data.api_key) {
          console.log(`[AppAgent] Found JWT in centralized UserDO`);
          return data.api_key;
        } else {
          console.warn(`[AppAgent] UserDO returned empty api_key field`);
        }
      } else {
        const errorText = await response.text();
        console.error(
          `[AppAgent] UserDO request failed: ${response.status} - ${errorText}`
        );
      }

      console.warn(
        `[AppAgent] No JWT token found in centralized UserDO for user: ${userId}`
      );
      return null;
    } catch (error) {
      console.error("[AppAgent] Failed to fetch JWT from UserDO:", error);
      return null;
    }
  }

  /**
   * Get AI provider using user-specific API key if available
   * Includes retry logic for token refresh on 403 errors
   */
  async getAIProvider() {
    const state = this.state as AppAgentState;
    // Fetch JWT from centralized UserDO instead of state for security
    const userApiKey = await this.getJWTFromUserDO();

    if (userApiKey) {
      console.log(
        `[AppAgent] Using user-specific API key for user: ${state.userInfo?.id}`
      );
      return getAnthropic(this.env, userApiKey);
    }
    const errorMsg =
      "No user API key available. User must be authenticated to use AI features.";
    console.error(`[AppAgent] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  /**
   * Refresh token from OAuth provider when 403 errors occur
   * This handles the case where the database token is stale
   */
  async refreshTokenOnError() {
    try {
      // Fetch current JWT from centralized UserDO instead of state
      const currentApiKey = await this.getJWTFromUserDO();

      if (!currentApiKey) {
        console.log("[AppAgent] No current API key to refresh");
        return false;
      }

      console.log(
        "[AppAgent] Attempting to refresh user info due to API error"
      );

      // Try to fetch fresh user info with current token
      // This will detect if the token is invalid and handle accordingly
      await this.fetchUserInfoFromOAuth(currentApiKey);

      // Check if token was actually updated in UserDO
      const newApiKey = await this.getJWTFromUserDO();

      if (newApiKey && newApiKey !== currentApiKey) {
        console.log(`[AppAgent] ✅ Token refreshed successfully`);
        return true;
      }
      console.log("[AppAgent] Token refresh did not result in new token");
      return false;
    } catch (error) {
      console.error("[AppAgent] Error during token refresh:", error);
      return false;
    }
  }

  /**
   * Get system prompt for the agent
   */
  getSystemPrompt() {
    return getSystemPrompt();
  }

  /**
   * Get the appropriate tools based on the current agent mode
   */
  async getToolsForMode() {
    const state = this.state as AppAgentState;
    const mode = state.mode;

    console.log(`[AppAgent] Getting tools for mode: ${mode}`);

    // Base tools available in all modes
    const baseTools = {
      // Ball simulation tools
      addBall: tools.addBall,
      addMultipleBalls: tools.addMultipleBalls,
      clearBalls: tools.clearBalls,
      getBallState: tools.getBallState,
      removeBall: tools.removeBall,
      setGravity: tools.setGravity,
      toggleSimulation: tools.toggleSimulation,

      // Browser tools
      browseWebPage: tools.browseWebPage,
      browseWithBrowserbase: tools.browseWithBrowserbase,
      cancelScheduledTask: tools.cancelScheduledTask,
      fetchWebPage: tools.fetchWebPage,

      // State tools
      getAgentState: tools.getAgentState,
      getLocalTime: tools.getLocalTime,
      getScheduledTasks: tools.getScheduledTasks,
      // Context tools
      getWeatherInformation: tools.getWeatherInformation,

      // Search tools
      runResearch: tools.runResearch,

      // Scheduling tools
      scheduleTask: tools.scheduleTask,
      setMode: tools.setMode
    };

    // Mode-specific tools
    switch (mode) {
      case "act":
        // Action mode - enable all tools for execution
        return {
          ...baseTools,
          testErrorTool: tools.testErrorTool
        } as ToolSet;

      case "plan":
      default:
        // Planning mode - basic tools for planning and analysis
        return {
          ...baseTools
        } as ToolSet;
    }
  }

  /**
   * Handles incoming chat messages and manages the response stream
   * @param onFinish - Callback function executed when streaming completes
   * @param options - Optional parameters including abortSignal
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    // Get the current mode's tools (need to do this before stream creation)
    const modeTools = await this.getToolsForMode();
    const state = this.state as AppAgentState;
    const currentMode = state.mode;
    const systemPrompt = this.getSystemPrompt();

    console.log(`[AppAgent] Processing chat message in ${currentMode} mode`);

    // We don't have MCP implementation yet, so just use mode tools
    const allTools = modeTools;

    // Create the response using the new AI SDK v6 pattern
    const response = createUIMessageStreamResponse({
      stream: createUIMessageStream({
        execute: async ({ writer }) => {
          // Process any pending tool calls from previous messages
          // This handles human-in-the-loop confirmations for tools
          const processedMessages = await processToolCalls({
            dataStream: writer,
            executions,
            messages: this.messages,
            tools: allTools
          });

          // Filter out empty messages for AI provider compatibility
          const filteredMessages = filterEmptyMessages(processedMessages);

          // Convert UI messages to model messages for streamText
          const modelMessages = await convertToModelMessages(filteredMessages);

          // Retry logic for handling token refresh on 403 errors
          let retryCount = 0;
          const maxRetries = 1;

          while (retryCount <= maxRetries) {
            try {
              const anthropic = await this.getAIProvider();
              let model = anthropic("claude-haiku-4-5-20251001");

              // Enable simulation for testing if environment variable is set
              if ((this.env as any).SIMULATE_THINKING_TOKENS === "true") {
                // Type assertion needed due to LanguageModelV1 vs V3 differences
                model = simulateThinkingLLM() as typeof model;
                console.log(
                  "[AppAgent] Using simulated thinking tokens for testing"
                );
              }

              // Stream the AI response
              const result = streamText({
                stopWhen: stepCountIs(10),
                messages: modelMessages,
                model,
                temperature: 1,

                onError: async (error: unknown) => {
                  console.error("Error while streaming:", error);
                  if (
                    error &&
                    typeof error === "object" &&
                    "status" in error &&
                    error.status === 403 &&
                    retryCount < maxRetries
                  ) {
                    console.log(
                      "[AppAgent] Got 403 error, attempting token refresh"
                    );
                    const refreshed = await this.refreshTokenOnError();
                    if (refreshed) {
                      console.log(
                        "[AppAgent] Token refreshed, will retry request"
                      );
                      return;
                    }
                  }
                  throw error;
                },

                onFinish: async (args) => {
                  console.log(
                    `[AppAgent] Completed processing message in ${currentMode} mode`
                  );

                  // Handle reasoning tokens if they exist
                  if ("reasoningText" in args && args.reasoningText) {
                    console.log(
                      `[AppAgent] Reasoning tokens captured: ${args.reasoningText.length} characters`
                    );
                    console.log(
                      `[AppAgent] Reasoning preview: ${args.reasoningText.substring(0, 200)}...`
                    );

                    // Stream thinking tokens to the client for optional display
                    writer.write({
                      type: "data-thinking",
                      data: {
                        content: args.reasoningText
                      }
                    });
                  }

                  // Pass args directly to onFinish callback
                  onFinish(
                    args as Parameters<StreamTextOnFinishCallback<ToolSet>>[0]
                  );
                },

                system: systemPrompt,
                tools: allTools
              });

              // Merge the AI response stream
              writer.merge(result.toUIMessageStream());
              break; // Success, exit retry loop
            } catch (error: unknown) {
              console.error("[AppAgent] Error in onChatMessage:", error);

              // Handle 403 errors with token refresh retry
              if (
                error &&
                typeof error === "object" &&
                "status" in error &&
                error.status === 403 &&
                retryCount < maxRetries
              ) {
                console.log(
                  "[AppAgent] Got 403 error in catch block, attempting token refresh"
                );
                const refreshed = await this.refreshTokenOnError();
                if (refreshed) {
                  retryCount++;
                  console.log(
                    `[AppAgent] Token refreshed, retrying (attempt ${retryCount}/${maxRetries})`
                  );
                  continue;
                }
              }

              // If not a 403 error or retry failed, throw error
              throw error;
            }
          }
        }
      })
    });

    return response;
  }

  /**
   * Execute a scheduled task
   */
  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        parts: [
          { type: "text", text: `Running scheduled task: ${description}` }
        ],
        createdAt: new Date(),
        id: generateId(),
        role: "user"
      }
    ] as UIMessage[]);
  }

  /**
   * Initialize custom database tables and other setup
   *
   * NOTE: These tables are EXAMPLE CODE to show how you can create custom tables
   * for your agent. The template itself doesn't actually use these tables -
   * it uses the agent's built-in state management and framework tables instead.
   *
   * If you want to store custom data in database tables, you can:
   * 1. Define your table schema here
   * 2. Use this.sql`INSERT/SELECT/UPDATE` operations in your tools
   * 3. See src/agent/storage/ for example helper functions
   */
  async initialize() {
    // EXAMPLE: Create custom tables for storing additional data
    // These are not used by the template but show how you could add your own tables
    try {
      // Example: Custom settings table (alternative to agent state)
      await this.sql`
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT
        )
      `;

      // User authentication and billing info table (JWT token stored in UserDO only)
      await this.sql`
        CREATE TABLE IF NOT EXISTS user_info (
          user_id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          credits REAL NOT NULL,
          payment_method TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Example: Custom tasks/work items table
      await this.sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          status TEXT NOT NULL,
          last_updated TEXT NOT NULL
        )
      `;

      // Example: Custom interaction history table
      await this.sql`
        CREATE TABLE IF NOT EXISTS interaction_history (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          action TEXT NOT NULL,
          result TEXT NOT NULL,
          FOREIGN KEY(task_id) REFERENCES tasks(id)
        )
      `;

      console.log("Example database tables initialized successfully");
    } catch (error) {
      console.error("Error initializing example database tables:", error);
    }
  }

  /**
   * Handle direct HTTP requests to the agent
   * This is used for actions like setting the mode
   */
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    console.log("Incoming agent request", {
      method: request.method,
      pathname: url.pathname,
      url: url.toString()
    });

    // Validate that the URL follows project-specific format
    // Expected: /agents/app-agent/{userId}-{projectName}/...
    const pathParts = url.pathname.split("/");
    if (
      pathParts.length >= 4 &&
      pathParts[1] === "agents" &&
      pathParts[2] === "app-agent"
    ) {
      const agentPath = pathParts[3];
      const dashParts = agentPath.split("-");

      // Check if this looks like a non-project-specific URL
      if (
        agentPath === "not-project-specific" ||
        !agentPath.includes("-") ||
        dashParts.length < 2
      ) {
        const errorMessage = `Invalid agent URL: '${url.pathname}' must follow project-specific format '/agents/app-agent/{userId}-{projectName}/...'. Non-project-specific agents are not supported.`;
        console.error("[AppAgent]", errorMessage);
        throw new Error(errorMessage);
      }

      const [userId, projectName] = agentPath.split("-", 2);
      console.log(
        `[AppAgent] Processing request for project-specific agent - User: ${userId}, Project: ${projectName}`
      );
    }

    // Extra logging for store-user-info requests
    if (url.pathname.includes("store-user-info")) {
      console.log(
        `[AppAgent] STORE-USER-INFO REQUEST DETECTED - Method: ${request.method}, Path: ${url.pathname}`
      );
    }

    // Extract OAuth token from request
    const token = url.searchParams.get("token");
    const currentState = this.state as AppAgentState;

    if (token && !currentState.userInfo) {
      console.log(
        "[AppAgent] No user info in state, attempting to load from database or OAuth"
      );
      await this.loadUserInfo(token);
    }

    // Handle internal user info storage request
    if (
      url.pathname.endsWith("/store-user-info") &&
      request.method === "POST"
    ) {
      console.log(
        `[AppAgent] store-user-info endpoint called with URL: ${url.pathname}`
      );
      try {
        const userInfo = (await request.json()) as {
          user_id: string;
          api_key: string;
          email: string;
          credits: number;
          payment_method: string;
        };

        console.log(
          `[AppAgent] Storing user info for user: ${userInfo.user_id}`
        );

        console.log(`[AppAgent] Storing user info and JWT token in UserDO`);

        // Store user info in local database (excluding api_key - only in UserDO)
        this.sql`
          INSERT OR REPLACE INTO user_info (
            user_id, email, credits, payment_method, updated_at
          ) VALUES (
            ${userInfo.user_id},
            ${userInfo.email},
            ${userInfo.credits},
            ${userInfo.payment_method},
            ${new Date().toISOString()}
          )
        `;

        // ALSO store in centralized UserDO (this is the important fix!)
        console.log(
          `[AppAgent] Also storing user info in centralized UserDO...`
        );
        try {
          const userDOId = this.env.UserDO.idFromName(userInfo.user_id);
          const userDO = this.env.UserDO.get(userDOId);

          const userDOResponse = await userDO.fetch(
            new Request(`https://user-do/store-user-info`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(userInfo)
            })
          );

          if (userDOResponse.ok) {
            console.log(
              `[AppAgent] Successfully stored user info in UserDO for user: ${userInfo.user_id}`
            );
          } else {
            const errorText = await userDOResponse.text();
            console.error(
              `[AppAgent] Failed to store in UserDO: ${userDOResponse.status} - ${errorText}`
            );
          }
        } catch (userDOError) {
          console.error(`[AppAgent] Error storing in UserDO:`, userDOError);
        }

        // JWT token is now stored only in centralized UserDO, not in local database

        // Also update agent state for immediate use (without JWT for security)
        const updatedState: AppAgentState = {
          ...currentState,
          userInfo: {
            // JWT token removed - now stored only in SQLite for security
            credits: userInfo.credits,
            email: userInfo.email,
            id: userInfo.user_id,
            payment_method: userInfo.payment_method
          }
        };

        this.setState(updatedState);

        console.log(
          `[AppAgent] Successfully stored user info in database for user: ${userInfo.user_id}`
        );
        return new Response("OK");
      } catch (error) {
        console.error("[AppAgent] Error storing user info:", error);
        return new Response("Error storing user info", { status: 500 });
      }
    }

    // Handle user info clearing request (for logout)
    if (
      url.pathname.endsWith("/clear-user-info") &&
      request.method === "POST"
    ) {
      try {
        console.log("[AppAgent] Clearing cached user info");

        // Clear user info from database
        await this.sql`DELETE FROM user_info`;

        // Clear user info from agent state
        const updatedState: AppAgentState = {
          ...currentState,
          userInfo: undefined
        };

        this.setState(updatedState);

        console.log("[AppAgent] Successfully cleared cached user info");
        return new Response("OK");
      } catch (error) {
        console.error("[AppAgent] Error clearing user info:", error);
        return new Response("Error clearing user info", { status: 500 });
      }
    }

    // Handle mode change requests
    if (url.pathname.includes("/set-mode")) {
      console.log(`[AppAgent] Detected set-mode request: ${url.pathname}`);

      try {
        // Only accept POST requests for mode changes
        if (request.method !== "POST") {
          console.log(
            "[AppAgent] Method not allowed for set-mode:",
            request.method
          );
          return Response.json(
            {
              error: "Method not allowed, use POST",
              success: false
            },
            { status: 405 }
          );
        }

        const body = await request.json();
        const {
          mode: newModeString,
          force: forceFlag,
          isAfterClearHistory: clearHistoryFlag
        } = body as {
          mode?: string;
          force?: boolean;
          isAfterClearHistory?: boolean;
        };
        const newMode = newModeString as AgentMode;
        const force = forceFlag === true;
        const isAfterClearHistory = clearHistoryFlag === true;

        if (!newMode || !["plan", "act"].includes(newMode)) {
          return Response.json(
            {
              error: "Invalid mode specified. Valid modes are: plan, act",
              success: false
            },
            { status: 400 }
          );
        }

        // Call the setMode method to change modes and inject transition messages
        console.log(
          `[AppAgent] Processing mode change request: mode=${newMode}, force=${force}, isAfterClearHistory=${isAfterClearHistory}`
        );
        const result = await this.setMode(newMode, force, isAfterClearHistory);

        return Response.json(result);
      } catch (error) {
        console.error("[AppAgent] Error processing mode change:", error);
        return Response.json(
          {
            error: error instanceof Error ? error.message : String(error),
            success: false
          },
          { status: 500 }
        );
      }
    }

    // For API endpoints requesting messages - ALWAYS return an array to prevent .map() errors
    if (url.pathname.endsWith("/get-messages")) {
      console.log("[AppAgent] Handling /get-messages request");

      try {
        // Query messages from SQLite database (persisted across DO evictions)
        const messageRows = this
          .sql`SELECT * FROM cf_ai_chat_agent_messages ORDER BY created_at`;
        const messages = [];

        for await (const row of messageRows) {
          try {
            messages.push(JSON.parse(row.message as string));
          } catch (error) {
            console.error(
              "[AppAgent] Error parsing message from database:",
              error
            );
            // Skip malformed messages rather than failing entirely
          }
        }
        const messageCount = Array.isArray(messages) ? messages.length : 0;

        console.log(
          `[AppAgent] /get-messages returning ${messageCount} messages`
        );

        return Response.json(messages);
      } catch (error) {
        // If there's any error (auth, db, etc.), return empty array instead of error object
        console.error(
          "[AppAgent] Error in /get-messages, returning empty array:",
          error
        );
        return Response.json([]);
      }
    }

    // Backup endpoint to export the entire Agent data as JSON
    if (url.pathname.endsWith("/backup/export")) {
      console.log("[AppAgent] Backup export requested");

      // Use the utility function to handle export
      const exportResult = await exportAgentData(this);

      // Return the full database export as pretty-formatted JSON
      return new Response(JSON.stringify(exportResult, null, 2), {
        headers: {
          "Content-Disposition": `attachment; filename="agent-export-${Date.now()}.json"`,
          "Content-Type": "application/json"
        }
      });
    }

    // Create project endpoint
    if (url.pathname.endsWith("/create-project") && request.method === "POST") {
      console.log("[AppAgent] Project creation requested");

      try {
        const body = (await request.json()) as {
          projectName: string;
          displayName: string;
        };
        const { projectName, displayName } = body;

        if (!projectName || !displayName) {
          return Response.json(
            {
              error: "projectName and displayName are required",
              success: false
            },
            { status: 400 }
          );
        }

        // Get user info to verify authentication
        const state = this.state as AppAgentState;
        if (!state.userInfo?.id) {
          return Response.json(
            { error: "User not authenticated", success: false },
            { status: 401 }
          );
        }

        // Use UserDO to create the project
        const userDOId = this.env.UserDO.idFromName(state.userInfo.id);
        const userDO = this.env.UserDO.get(userDOId);

        const userDOResponse = await userDO.fetch(
          new Request("https://localhost/create-project", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectName, displayName })
          })
        );

        if (!userDOResponse.ok) {
          const error = await userDOResponse.text();
          return Response.json(
            { error: `Failed to create project: ${error}`, success: false },
            { status: 500 }
          );
        }

        return Response.json({ success: true });
      } catch (error) {
        console.error("[AppAgent] Error creating project:", error);
        return Response.json(
          { error: "Internal server error", success: false },
          { status: 500 }
        );
      }
    }

    // Get projects endpoint
    if (url.pathname.endsWith("/get-projects")) {
      console.log("[AppAgent] Projects list requested");

      try {
        // Get user info to verify authentication
        const state = this.state as AppAgentState;
        if (!state.userInfo?.id) {
          return Response.json(
            { error: "User not authenticated", success: false },
            { status: 401 }
          );
        }

        // Use UserDO to get projects
        const userDOId = this.env.UserDO.idFromName(state.userInfo.id);
        const userDO = this.env.UserDO.get(userDOId);

        const userDOResponse = await userDO.fetch(
          new Request("https://localhost/list-projects")
        );

        if (!userDOResponse.ok) {
          const error = await userDOResponse.text();
          return Response.json(
            { error: `Failed to get projects: ${error}`, success: false },
            { status: 500 }
          );
        }

        const projects = await userDOResponse.json();
        return Response.json(projects);
      } catch (error) {
        console.error("[AppAgent] Error getting projects:", error);
        return Response.json(
          { error: "Internal server error", success: false },
          { status: 500 }
        );
      }
    }

    // Backup import endpoint to restore data from a previous export
    if (url.pathname.endsWith("/backup/import")) {
      // Only accept POST requests for import
      if (request.method !== "POST") {
        return Response.json(
          {
            error: "Method not allowed, use POST",
            success: false
          },
          { status: 405 }
        );
      }

      console.log("[AppAgent] Data import requested");

      // Check content type to determine how to handle the request
      const contentType = request.headers.get("Content-Type") || "";
      let importRequest: ImportRequest;

      if (contentType.includes("multipart/form-data")) {
        // Handle multipart/form-data with file upload
        console.log("[AppAgent] Processing multipart form data upload");

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
          return Response.json(
            {
              error:
                "No file provided in the request. Please upload a backup file.",
              success: false
            },
            { status: 400 }
          );
        }

        // Read the file content
        const fileContent = await file.text();
        let importData: DatabaseExportResult;

        try {
          importData = JSON.parse(fileContent) as DatabaseExportResult;
        } catch (_parseError) {
          return Response.json(
            {
              error:
                "Invalid JSON file format. Could not parse the backup file.",
              success: false
            },
            { status: 400 }
          );
        }

        // Validate the imported data
        if (!importData.metadata || !importData.tables) {
          return Response.json(
            {
              error:
                "Invalid backup file structure. Missing metadata or tables.",
              success: false
            },
            { status: 400 }
          );
        }

        // Parse options from form data
        const preserveAgentId = formData.get("preserveAgentId") === "true";
        const includeMessages = formData.get("includeMessages") !== "false"; // Default to true
        const includeScheduledTasks =
          formData.get("includeScheduledTasks") !== "false"; // Default to true

        importRequest = {
          data: importData,
          options: {
            includeMessages,
            includeScheduledTasks,
            preserveAgentId
          }
        };
      } else {
        console.log("[AppAgent] Processing JSON payload import");

        interface ImportRequestBody {
          options?: {
            preserveAgentId?: boolean;
            includeMessages?: boolean;
            includeScheduledTasks?: boolean;
          };
          data: {
            metadata: {
              exportedAt: string;
              agentId: string;
              state: AppAgentState;
            };
            tables: Record<string, Record<string, unknown>>;
          };
        }

        const body = (await request.json()) as ImportRequestBody;

        // Validate that the request has the required fields
        if (!body.data || !body.data.metadata || !body.data.tables) {
          return Response.json(
            {
              error:
                "Invalid import data format. Expected {options, data} structure.",
              success: false
            },
            { status: 400 }
          );
        }

        importRequest = {
          data: body.data as unknown as DatabaseExportResult,
          options: body.options || {}
        };
      }

      // Process import
      const importResult = await importAgentData(this, importRequest);
      return Response.json(importResult);
    }

    // Handle image export requests (PNG/SVG)
    if (url.pathname.endsWith("/export") && request.method === "POST") {
      console.log("[AppAgent] Image export requested");

      try {
        const body = (await request.json()) as {
          type?: "png" | "svg";
          format?: "social" | "document" | "mobile";
          theme?: "light" | "dark";
          includeDebug?: boolean;
        };

        const {
          format = "square",
          theme = "light",
          includeDebug = false
        } = body;

        // Validate format for share asset generator
        const validFormat =
          format === "mobile" || format === "square" ? format : "square";

        // Get current agent state
        const state = this.state as AppAgentState;

        // Create export generator service
        const exportGenerator = new ShareAssetGenerator();

        // Generate PNG export
        const pngBuffer = await exportGenerator.generatePNGExport(state, {
          format: validFormat,
          theme,
          includeDebug
        });

        return new Response(Buffer.from(pngBuffer), {
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="agent-export-${format}-${theme}.png"`
          }
        });
      } catch (error) {
        console.error("[AppAgent] Error generating export:", error);
        return Response.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          },
          { status: 500 }
        );
      }
    }

    // For all other cases, let the regular chat flow handle it
    return super.onRequest(request);
  }

  /**
   * Handle state updates and log the entire state for debugging
   */
  onStateUpdate(state: AppAgentState, source: "server" | Connection) {
    // Get message count to help with debugging
    const messageCount = this.messages?.length || 0;
    const lastMessageId =
      messageCount > 0 ? this.messages?.[messageCount - 1]?.id : "none";

    console.log("[AppAgent] State updated:", {
      lastMessageId,
      messageCount,
      mode: state?.mode,
      source: typeof source === "string" ? source : "client",
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle new client connections
   */
  async onConnect(connection: Connection) {
    console.log(`[AppAgent] New client connection: ${connection.id}`);

    console.log("[AppAgent] Connection established", {
      connectionId: connection.id,
      timestamp: new Date().toISOString()
    });

    // SOLUTION: Load user info from database and rely on retry logic for token refresh
    try {
      console.log("[AppAgent] Loading user info from database...");
      await this.loadUserInfo();
      console.log("[AppAgent] ✅ User info loaded from database");
    } catch (error) {
      console.error("[AppAgent] Error loading user info:", error);
    }

    // Send a connection-ready event to signal that setup is complete
    // The client can listen for this to know when to check for messages
    connection.send(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type: "connection-ready"
      })
    );
  }

  /**
   * Set the agent's operating mode
   *
   * @param mode The mode to set
   * @param force If true, will override validation checks
   * @param isAfterClearHistory If true, indicates this is after clearing history
   */
  async setMode(mode: AgentMode, force = false, _isAfterClearHistory = false) {
    const currentState = this.state as AppAgentState;
    const previousMode = currentState.mode;

    // Check if mode is actually changing
    if (previousMode !== mode || force) {
      console.log(`[AppAgent] Updating state: ${previousMode} → ${mode}`);

      // Simple state update, no message manipulation
      await this.setState({
        ...currentState,
        _lastModeChange: new Date().toISOString(),
        mode
      });

      console.log(`[AppAgent] Mode changed to ${mode}`);
    }

    return {
      currentMode: mode,
      previousMode,
      success: true
    };
  }

  /**
   * Get Browserbase API key safely for use in tools
   */
  getBrowserbaseApiKey() {
    return this.env.BROWSERBASE_API_KEY;
  }

  /**
   * Get Browser API key for the external browser rendering service
   */
  async getBrowserApiKey() {
    // Fetch JWT from centralized UserDO instead of state for security
    const userApiKey = await this.getJWTFromUserDO();

    if (userApiKey) {
      return userApiKey;
    }

    throw new Error(
      "No user API key available for browser rendering service. User must be authenticated."
    );
  }

  /**
   * Get Browser API base URL for the external browser rendering service
   */
  getBrowserApiBaseUrl() {
    return this.env.GATEWAY_BASE_URL;
  }

  /**
   * Get table description for export/import
   * Get a description of a table based on its name
   * Used for the database export feature
   */
  getTableDescription(tableName: string): string {
    const descriptions: Record<string, string> = {
      interaction_history: "Stores history of interactions",
      settings: "Stores agent settings and configuration",
      tasks: "Stores task data"
    };
    return descriptions[tableName] || "Unknown table";
  }

  /**
   * Fetch user info from OAuth provider
   */
  async fetchUserInfoFromOAuth(token: string): Promise<void> {
    try {
      // Use the OAuth provider URL (website) for token verification
      const oauthProviderUrl =
        this.env.OAUTH_PROVIDER_BASE_URL || "https://atyourservice.ai";
      const verifyEndpoint = `${oauthProviderUrl}/oauth/verify`;

      console.log(
        `[AppAgent] Fetching user info from OAuth provider: ${verifyEndpoint}`
      );

      const response = await fetch(verifyEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[AppAgent] OAuth verification failed: ${response.status} - ${errorText}`
        );
        return;
      }

      const userInfo = (await response.json()) as {
        id: string;
        email: string;
        credits: number;
        payment_method: string;
      };

      console.log(
        `[AppAgent] Fetched user info from OAuth for user: ${userInfo.id}`
      );

      // Store user info in local database (excluding api_key - only in UserDO)
      // OAuth token IS the gateway API key but stored only in UserDO
      this.sql`
        INSERT OR REPLACE INTO user_info (
          user_id, email, credits, payment_method, updated_at
        ) VALUES (
          ${userInfo.id},
          ${userInfo.email},
          ${userInfo.credits},
          ${userInfo.payment_method},
          ${new Date().toISOString()}
        )
      `;

      // Store JWT token ONLY in centralized UserDO
      try {
        const userDOId = this.env.UserDO.idFromName(userInfo.id);
        const userDO = this.env.UserDO.get(userDOId);

        const userDOResponse = await userDO.fetch(
          new Request(`https://user-do/store-user-info`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userInfo.id,
              api_key: token,
              email: userInfo.email,
              credits: userInfo.credits,
              payment_method: userInfo.payment_method
            })
          })
        );

        if (userDOResponse.ok) {
          console.log(
            `[AppAgent] Successfully stored JWT token in UserDO for user: ${userInfo.id}`
          );
        } else {
          const errorText = await userDOResponse.text();
          console.error(
            `[AppAgent] Failed to store JWT in UserDO: ${userDOResponse.status} - ${errorText}`
          );
        }
      } catch (userDOError) {
        console.error(`[AppAgent] Error storing JWT in UserDO:`, userDOError);
      }

      // Update agent state
      const state = this.state as AppAgentState;
      const updatedState: AppAgentState = {
        ...state,
        userInfo: {
          // JWT token removed - now stored only in SQLite for security
          credits: userInfo.credits,
          email: userInfo.email,
          id: userInfo.id,
          payment_method: userInfo.payment_method
        }
      };

      this.setState(updatedState);
      console.log(
        `[AppAgent] Successfully fetched and stored user info for user: ${userInfo.id}`
      );
    } catch (error) {
      console.error("[AppAgent] Error fetching user info from OAuth:", error);
    }
  }

  /**
   * Load user info from database if available, or fetch from OAuth if needed
   */
  async loadUserInfo(oauthToken?: string) {
    try {
      const userInfoResults = await this.sql`
        SELECT * FROM user_info LIMIT 1
      `;

      if (userInfoResults && userInfoResults.length > 0) {
        const userInfo = userInfoResults[0] as {
          user_id: string;
          email: string;
          credits: number;
          payment_method: string;
        };

        // Check if the stored API key matches the current OAuth token
        const storedApiKey = await this.getJWTFromUserDO();
        if (oauthToken && storedApiKey !== oauthToken) {
          console.log(
            "[AppAgent] Stored API key doesn't match current token, fetching fresh user info from OAuth"
          );
          await this.fetchUserInfoFromOAuth(oauthToken);
          return;
        }

        const state = this.state as AppAgentState;
        const updatedState: AppAgentState = {
          ...state,
          userInfo: {
            // JWT token removed - now stored only in SQLite for security
            credits: userInfo.credits,
            email: userInfo.email,
            id: userInfo.user_id,
            payment_method: userInfo.payment_method
          }
        };

        this.setState(updatedState);
        console.log(
          `[AppAgent] Loaded user info from database for user: ${userInfo.user_id}`
        );
      } else {
        console.log("[AppAgent] No user info found in database");

        if (oauthToken) {
          await this.fetchUserInfoFromOAuth(oauthToken);
        }
      }
    } catch (error) {
      console.error("[AppAgent] Error loading user info from database:", error);
    }
  }
}
