import { createOpenAI } from "@ai-sdk/openai";
// import { createAnthropic } from "@ai-sdk/anthropic";
// import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { Schedule } from "agents";
import type { AgentContext } from "agents";
import type { Connection } from "agents";
import { AIChatAgent } from "agents/ai-chat-agent";
import {
  type StreamTextOnFinishCallback,
  type ToolSet,
  createDataStreamResponse,
  generateId,
  streamText,
} from "ai";
import type { Message } from "@ai-sdk/ui-utils";
import { getUnifiedSystemPrompt } from "./prompts/index";
import { executions, tools } from "./tools/registry";
import { processToolCalls } from "./utils/tool-utils";
import {
  exportAgentData,
  importAgentData,
  type ImportRequest,
  type DatabaseExportResult,
} from "./utils/export-import-utils";
import type {
  Operator,
  AdminContact,
  TestResult,
  ToolDocumentation,
  TestReport,
  TransitionRecommendation,
  TypedRecord,
} from "./types/generic";

// AI @ Your Service Gateway configuration
const getOpenAI = (env: Env, apiKey?: string) => {
  return createOpenAI({
    apiKey: apiKey || env.GATEWAY_API_KEY,
    baseURL: `${env.GATEWAY_BASE_URL}/v1/openai`,
  });
};

/*
// AI @ Your Service Gateway configuration for Anthropic
const getAnthropic = (env: Env) => {
  return createAnthropic({
    apiKey: env.GATEWAY_API_KEY,
    baseURL: `${env.GATEWAY_BASE_URL}/v1/anthropic`,
  });
};
*/

/*
// AI @ Your Service Gateway configuration for Gemini
const getGemini = (env: Env) => {
  return createGoogleGenerativeAI({
    apiKey: env.GATEWAY_API_KEY,
    baseURL: `${env.GATEWAY_BASE_URL}/v1/google-ai-studio`,
  });
};
*/

// Helper function to filter out empty messages for AI provider compatibility
const filterEmptyMessages = (messages: Message[]) => {
  return messages.filter((message, index) => {
    // Allow empty content only for the final assistant message
    const isLastMessage = index === messages.length - 1;
    const isAssistant = message.role === "assistant";
    const hasEmptyContent =
      !message.content ||
      (typeof message.content === "string" && message.content.trim() === "") ||
      (Array.isArray(message.content) && message.content.length === 0);

    // Keep the message if it has content, or if it's the final assistant message
    return !hasEmptyContent || (isLastMessage && isAssistant);
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

// Agent operating modes
export type AgentMode = "onboarding" | "integration" | "plan" | "act";

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
    api_key?: string; // User's AtYourService.ai API key
  };

  // Onboarding mode state
  onboardingStep?: string;
  isOnboardingComplete: boolean;

  // Integration mode state
  testResults?: TypedRecord<string, TestResult>;
  toolDocumentation?: TypedRecord<string, ToolDocumentation>;
  testReport?: TestReport;
  isIntegrationComplete?: boolean;
  transitionRecommendation?: TransitionRecommendation;

  // Optional metadata
  _lastModeChange?: string;
}

/**
 * Generic Agent implementation with multiple operational modes
 * Can operate as a planning assistant, action executor, or general purpose agent
 */
export class AppAgent extends AIChatAgent<Env> {
  // Define initial agent state including the current mode
  initialState: AppAgentState = {
    mode: "onboarding" as AgentMode,
    settings: {
      language: "en",
      operators: [],
      adminContact: {
        name: "",
        email: "",
      },
    },
    onboardingStep: "start",
    isOnboardingComplete: false,
    // Integration state
    testResults: {},
    toolDocumentation: {},
    isIntegrationComplete: false,
  };

  // Ensure the current state matches the latest schema, merging in any missing fields
  ensureStateSchema(inputState: AppAgentState | undefined): AppAgentState {
    // Create a local copy of the state to avoid parameter reassignment
    const state = inputState ? { ...inputState } : ({} as AppAgentState);

    // Always ensure a valid mode is set
    if (
      !state ||
      !state.mode ||
      !["onboarding", "integration", "plan", "act"].includes(state.mode)
    ) {
      console.log(
        "[AppAgent] No valid mode found in state, defaulting to onboarding mode"
      );
      state.mode = "onboarding";
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
          ?.adminContact || { name: "", email: "" };
    }

    return state;
  }

  constructor(ctx: AgentContext, env: Env) {
    super(ctx, env);
    // Load initial state and ensure schema
    const state = this.state as AppAgentState;
    const updatedState = this.ensureStateSchema(state);
    this.setState(updatedState);

    // Initialize database tables
    this.initialize().catch((error) => {
      console.error("Failed to initialize database:", error);
    });
  }

  /**
   * Get AI provider using user-specific API key if available
   */
  getAIProvider() {
    const state = this.state as AppAgentState;
    const userApiKey = state.userInfo?.api_key;

    if (userApiKey) {
      console.log(`[AppAgent] Using user-specific API key for user: ${state.userInfo?.id}`);
      return getOpenAI(this.env, userApiKey);
    } else {
      console.log("[AppAgent] Using default API key");
      return getOpenAI(this.env);
    }
  }

  /**
   * Get system prompt for the agent
   */
  getSystemPrompt() {
    // Use the unified system prompt for all modes
    return getUnifiedSystemPrompt();
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
      // Context tools
      getWeatherInformation: tools.getWeatherInformation,
      getLocalTime: tools.getLocalTime,

      // Browser tools
      browseWebPage: tools.browseWebPage,
      browseWithBrowserbase: tools.browseWithBrowserbase,
      fetchWebPage: tools.fetchWebPage,

      // Scheduling tools
      scheduleTask: tools.scheduleTask,
      getScheduledTasks: tools.getScheduledTasks,
      cancelScheduledTask: tools.cancelScheduledTask,

      // State tools
      getAgentState: tools.getAgentState,
      setMode: tools.setMode,

      // Messaging tools
      suggestActions: tools.suggestActions,

      // Search tools
      runResearch: tools.runResearch,
    };

    // Mode-specific tools
    switch (mode) {
      case "onboarding":
        // Onboarding mode - enable configuration tools
        return {
          ...baseTools,
          saveSettings: tools.saveSettings,
          completeOnboarding: tools.completeOnboarding,
          checkExistingConfig: tools.checkExistingConfig,
          getOnboardingStatus: tools.getOnboardingStatus,
        } as ToolSet;

      case "integration":
        // Integration mode - enable testing and documentation tools
        return {
          ...baseTools,
          recordTestResult: tools.recordTestResult,
          documentTool: tools.documentTool,
          generateTestReport: tools.generateTestReport,
          completeIntegrationTesting: tools.completeIntegrationTesting,
          testErrorTool: tools.testErrorTool,
        } as ToolSet;

      case "act":
        // Action mode - enable all tools for execution
        return {
          ...baseTools,
          testErrorTool: tools.testErrorTool,
        } as ToolSet;

      default:
        // Planning mode - basic tools for planning and analysis
        return {
          ...baseTools,
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
    options?: { abortSignal?: AbortSignal }
  ) {
    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    const dataStreamResponse = createDataStreamResponse({
      execute: async (dataStream) => {
        // Get the current mode's tools
        const modeTools = await this.getToolsForMode();
        const state = this.state as AppAgentState;
        const currentMode = state.mode;

        console.log(
          `[AppAgent] Processing chat message in ${currentMode} mode`
        );

        // We don't have MCP implementation yet, so just use mode tools
        // In the future, we can add MCP tools:
        // const allTools = {
        //   ...modeTools,
        //   ...this.mcp.unstable_getAITools(),
        // };
        const allTools = modeTools;

        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: this.messages,
          dataStream,
          tools: allTools,
          executions,
        });

        // Filter out empty messages for AI provider compatibility
        const filteredMessages = filterEmptyMessages(processedMessages);

        const openai = this.getAIProvider();
        const model = openai("gpt-4.1-2025-04-14");
        /*
        const anthropic = getAnthropic(this.env);
        const model = anthropic("claude-3-5-sonnet-20241022");
        const gemini = getGemini(this.env);
        const model = gemini("gemini-2.0-flash");
        */

        // Get system prompt based on current mode
        const systemPrompt = this.getSystemPrompt();

        // Stream the AI response
        const result = streamText({
          model,
          system: systemPrompt,
          messages: filteredMessages,
          tools: allTools,
          onFinish: async (args) => {
            // Log a message indicating the completion of the request
            console.log(
              `[AppAgent] Completed processing message in ${currentMode} mode`
            );

            // Pass args directly to onFinish callback
            onFinish(
              args as Parameters<StreamTextOnFinishCallback<ToolSet>>[0]
            );
          },
          onError: (error) => {
            console.error("Error while streaming:", error);
          },
          maxSteps: 10,
        });

        // Merge the AI response stream with tool execution outputs
        result.mergeIntoDataStream(dataStream);
      },
      onError: getErrorMessage,
    });

    return dataStreamResponse;
  }

  /**
   * Execute a scheduled task
   */
  async executeTask(description: string, task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        content: `Running scheduled task: ${description}`,
        createdAt: new Date(),
      },
    ]);
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
      url: url.toString(),
      pathname: url.pathname,
    });

    // Handle internal user info storage request
    if (url.pathname === "/store-user-info" && request.method === "POST") {
      try {
        const userInfo = await request.json() as {
          user_id: string;
          api_key: string;
          email: string;
          credits: number;
          payment_method: string;
        };

        console.log(`[AppAgent] Storing user info for user: ${userInfo.user_id}`);

        // Update agent state with user info
        const currentState = this.state as AppAgentState;
        const updatedState: AppAgentState = {
          ...currentState,
          userInfo: {
            id: userInfo.user_id,
            email: userInfo.email,
            credits: userInfo.credits,
            payment_method: userInfo.payment_method,
            api_key: userInfo.api_key,
          },
        };

        this.setState(updatedState);

        return new Response("OK");
      } catch (error) {
        console.error("[AppAgent] Error storing user info:", error);
        return new Response("Error storing user info", { status: 500 });
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
              success: false,
              error: "Method not allowed, use POST",
            },
            { status: 405 }
          );
        }

        const body = await request.json();
        const {
          mode: newModeString,
          force: forceFlag,
          isAfterClearHistory: clearHistoryFlag,
        } = body as {
          mode?: string;
          force?: boolean;
          isAfterClearHistory?: boolean;
        };
        const newMode = newModeString as AgentMode;
        const force = forceFlag === true;
        const isAfterClearHistory = clearHistoryFlag === true;

        if (
          !newMode ||
          !["onboarding", "integration", "plan", "act"].includes(newMode)
        ) {
          return Response.json(
            {
              success: false,
              error: "Invalid mode specified",
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
            success: false,
            error: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
      }
    }

    // For API endpoints requesting messages
    if (url.pathname.endsWith("/get-messages")) {
      console.log("[AppAgent] Handling /get-messages request");
      const messageCount = Array.isArray(this.messages)
        ? this.messages.length
        : 0;
      console.log(
        `[AppAgent] /get-messages returning ${messageCount} messages`
      );
    }

    // Export endpoint to export the entire Agent data
    if (url.pathname.endsWith("/export")) {
      console.log("[AppAgent] Data export requested");

      // Use the utility function to handle export
      const exportResult = await exportAgentData(this);

      // Return the full database export as pretty-formatted JSON
      return new Response(JSON.stringify(exportResult, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="agent-export-${Date.now()}.json"`,
        },
      });
    }

    // Import endpoint to restore data from a previous export
    if (url.pathname.endsWith("/import")) {
      // Only accept POST requests for import
      if (request.method !== "POST") {
        return Response.json(
          {
            success: false,
            error: "Method not allowed, use POST",
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
              success: false,
              error:
                "No file provided in the request. Please upload a backup file.",
            },
            { status: 400 }
          );
        }

        // Read the file content
        const fileContent = await file.text();
        let importData: DatabaseExportResult;

        try {
          importData = JSON.parse(fileContent) as DatabaseExportResult;
        } catch (parseError) {
          return Response.json(
            {
              success: false,
              error:
                "Invalid JSON file format. Could not parse the backup file.",
            },
            { status: 400 }
          );
        }

        // Validate the imported data
        if (!importData.metadata || !importData.tables) {
          return Response.json(
            {
              success: false,
              error:
                "Invalid backup file structure. Missing metadata or tables.",
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
          options: {
            preserveAgentId,
            includeMessages,
            includeScheduledTasks,
          },
          data: importData,
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
              success: false,
              error:
                "Invalid import data format. Expected {options, data} structure.",
            },
            { status: 400 }
          );
        }

        importRequest = {
          options: body.options || {},
          data: body.data as unknown as DatabaseExportResult,
        };
      }

      // Process import
      const importResult = await importAgentData(this, importRequest);
      return Response.json(importResult);
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
      mode: state?.mode,
      source: typeof source === "string" ? source : "client",
      timestamp: new Date().toISOString(),
      messageCount,
      lastMessageId,
    });
  }

  /**
   * Handle new client connections
   */
  async onConnect(connection: Connection) {
    console.log(`[AppAgent] New client connection: ${connection.id}`);

    // Send a connection-ready event to signal that setup is complete
    // The client can listen for this to know when to check for messages
    connection.send(
      JSON.stringify({
        type: "connection-ready",
        timestamp: new Date().toISOString(),
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
  async setMode(mode: AgentMode, force = false, isAfterClearHistory = false) {
    const currentState = this.state as AppAgentState;
    const previousMode = currentState.mode;

    // Check if mode is actually changing
    if (previousMode !== mode || force) {
      console.log(`[AppAgent] Updating state: ${previousMode} → ${mode}`);

      // Simple state update, no message manipulation
      await this.setState({
        ...currentState,
        mode,
        _lastModeChange: new Date().toISOString(),
      });

      console.log(`[AppAgent] Mode changed to ${mode}`);
    }

    return {
      success: true,
      previousMode,
      currentMode: mode,
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
  getBrowserApiKey() {
    return this.env.GATEWAY_API_KEY;
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
      settings: "Stores agent settings and configuration",
      tasks: "Stores task data",
      interaction_history: "Stores history of interactions",
    };
    return descriptions[tableName] || "Unknown table";
  }
}
