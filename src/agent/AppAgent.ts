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
const getOpenAI = (env: Env) => {
  return createOpenAI({
    apiKey: env.GATEWAY_API_KEY,
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
        "[AppAgent] No valid mode found in state, defaulting to plan mode"
      );
      state.mode = "plan";
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
   * Get system prompt for the agent
   */
  getSystemPrompt() {
    // Use the unified system prompt for all modes
    return getUnifiedSystemPrompt();
  }

  /**
   * Get tools available for the current mode
   */
  async getToolsForMode() {
    const state = this.state as AppAgentState;
    const mode = state.mode;

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
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    const dataStreamResponse = createDataStreamResponse({
      execute: async (dataStream) => {
        // Get the current mode's tools
        const modeTools = await this.getToolsForMode();
        const state = this.state as AppAgentState;
        const currentMode = state.mode;

        console.log(
          `[AppAgent] Processing chat message in ${currentMode} mode`
        );

        const allTools = modeTools;

        // Process any pending tool calls from previous messages
        const processedMessages = await processToolCalls({
          messages: this.messages,
          dataStream,
          tools: allTools,
          executions,
        });

        // Filter out empty messages for AI provider compatibility
        const filteredMessages = filterEmptyMessages(processedMessages);

        const openai = getOpenAI(this.env);
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
   * Initialize database tables and other setup
   */
  async initialize() {
    // Create tables for storing data
    try {
      await this.sql`
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT
        )
      `;

      await this.sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          status TEXT NOT NULL,
          last_updated TEXT NOT NULL
        )
      `;

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

      console.log("Database tables initialized successfully");
    } catch (error) {
      console.error("Error initializing database tables:", error);
    }
  }

  /**
   * Handle direct HTTP requests to the agent
   */
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    console.log("Incoming agent request", {
      url: url.toString(),
      pathname: url.pathname,
    });

    // Handle mode change requests
    if (url.pathname.includes("/set-mode")) {
      console.log(`[AppAgent] Detected set-mode request: ${url.pathname}`);

      try {
        if (request.method !== "POST") {
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

    // Export endpoint
    if (url.pathname.endsWith("/export")) {
      console.log("[AppAgent] Data export requested");
      const exportResult = await exportAgentData(this);
      return new Response(JSON.stringify(exportResult, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="agent-export-${Date.now()}.json"`,
        },
      });
    }

    // Import endpoint
    if (url.pathname.endsWith("/import")) {
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
      const contentType = request.headers.get("Content-Type") || "";
      let importRequest: ImportRequest;

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
          return Response.json(
            {
              success: false,
              error: "No file provided in the request",
            },
            { status: 400 }
          );
        }

        const fileContent = await file.text();
        let importData: DatabaseExportResult;

        try {
          importData = JSON.parse(fileContent) as DatabaseExportResult;
        } catch (parseError) {
          return Response.json(
            {
              success: false,
              error: "Invalid JSON file format",
            },
            { status: 400 }
          );
        }

        if (!importData.metadata || !importData.tables) {
          return Response.json(
            {
              success: false,
              error: "Invalid backup file structure",
            },
            { status: 400 }
          );
        }

        const preserveAgentId = formData.get("preserveAgentId") === "true";
        const includeMessages = formData.get("includeMessages") !== "false";
        const includeScheduledTasks =
          formData.get("includeScheduledTasks") !== "false";

        importRequest = {
          options: {
            preserveAgentId,
            includeMessages,
            includeScheduledTasks,
          },
          data: importData,
        };
      } else {
        const body = (await request.json()) as {
          data?: DatabaseExportResult;
          options?: unknown;
        };
        if (!body.data || !body.data.metadata || !body.data.tables) {
          return Response.json(
            {
              success: false,
              error: "Invalid import data format",
            },
            { status: 400 }
          );
        }

        importRequest = {
          options: body.options || {},
          data: body.data,
        };
      }

      const importResult = await importAgentData(this, importRequest);
      return Response.json(importResult);
    }

    return super.onRequest(request);
  }

  /**
   * Handle state updates and log the entire state for debugging
   */
  onStateUpdate(state: AppAgentState, source: "server" | Connection) {
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

    connection.send(
      JSON.stringify({
        type: "connection-ready",
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Set the agent's operating mode
   */
  async setMode(mode: AgentMode, force = false, isAfterClearHistory = false) {
    const currentState = this.state as AppAgentState;
    const previousMode = currentState.mode;

    if (previousMode !== mode || force) {
      console.log(`[AppAgent] Updating state: ${previousMode} → ${mode}`);

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
