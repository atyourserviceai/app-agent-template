import type { Message } from "@ai-sdk/react";
import { useAgentChat } from "agents/ai-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButtons } from "@/components/action-buttons/ActionButtons";
import { Avatar } from "@/components/avatar/Avatar";
// Component imports
import { Card } from "@/components/card/Card";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { EmptyChat } from "@/components/chat/EmptyChat";
import { ErrorMessage } from "@/components/chat/ErrorMessage";
import { LoadingIndicator } from "@/components/chat/LoadingIndicator";
import { MissingResponseIndicator } from "@/components/chat/MissingResponseIndicator";
import { PresentationContainer } from "@/components/chat/PresentationContainer";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ToolInvocationCard } from "@/components/tool-invocation-card/ToolInvocationCard";
import type { ToolTypes } from "./agent/tools/types";
import { AuthGuard } from "./components/auth/AuthGuard";
import { UserProfile } from "./components/auth/UserProfile";
import { Moon, Sun } from "@phosphor-icons/react";
import { ThemeToggleButton } from "@/components/theme/ThemeToggleButton";
// Auth components
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import { useThemePreference } from "./hooks/useThemePreference";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { useCurrentProjectAuth, useProjectAuth } from "./hooks/useAgentAuth";
import { ProjectProvider, useProject } from "./contexts/ProjectContext";
import { ProjectSelector } from "./components/project/ProjectSelector";
import { useAgentState } from "./hooks/useAgentState";
import { useErrorHandling } from "./hooks/useErrorHandling";
import type { AgentMode } from "./agent/AppAgent";
import { useMessageEditing } from "./hooks/useMessageEditing";
import {
  exportConversationToMarkdown,
  copyToClipboard
} from "./utils/exportUtils";

// Define agent data interface for typing
interface AgentData {
  connectionStatus?: "connected" | "disconnected" | "error" | "reconnecting";
  [key: string]: unknown;
}

// List of tools that require human confirmation for the generic template
const toolsRequiringConfirmation: (keyof ToolTypes)[] = [
  "getWeatherInformation"
  // Do not add suggestActions here as we want it to display without confirmation
];

// Add this new component to show suggested actions above the chat input
function SuggestedActions({
  messages,
  addToolResult,
  reload: _reload
}: {
  messages: Message[];
  addToolResult: (args: { toolCallId: string; result: string }) => void;
  reload: () => void;
}) {
  // SAFETY: Ensure messages is an array before processing
  const safeMessages = Array.isArray(messages) ? messages : [];

  // Find the latest message with suggestActions
  const lastAssistantMessage = [...safeMessages]
    .reverse()
    .find((msg) => msg.role === "assistant");

  if (!lastAssistantMessage) return null;

  // Find the suggestActions tool invocation in the message parts
  const suggestActionsPart = lastAssistantMessage.parts?.find(
    (part) =>
      part.type === "tool-invocation" &&
      "toolInvocation" in part &&
      part.toolInvocation.toolName === "suggestActions"
  );

  if (!suggestActionsPart || !("toolInvocation" in suggestActionsPart))
    return null;

  const toolInvocation = suggestActionsPart.toolInvocation;

  // Get the actions based on the state - they could be in args or result
  let actions: Array<{
    label: string;
    value: string;
    primary?: boolean;
    isOther?: boolean;
  }> = [];

  if (toolInvocation.state === "call") {
    // Handle call state - get actions from args
    actions =
      (toolInvocation.args.actions as Array<{
        label: string;
        value: string;
        primary?: boolean;
        isOther?: boolean;
      }>) || [];
  } else if (toolInvocation.state === "result" && toolInvocation.result) {
    // Handle result state - get actions from result
    // This ensures we can handle both cases where the tool execution may have modified the actions
    if (typeof toolInvocation.result === "string") {
      try {
        const parsedResult = JSON.parse(toolInvocation.result);
        if (parsedResult.actions) {
          actions = parsedResult.actions;
        }
      } catch (e) {
        console.error("Failed to parse suggestActions result", e);
      }
    } else if (toolInvocation.result && "actions" in toolInvocation.result) {
      actions = toolInvocation.result.actions as Array<{
        label: string;
        value: string;
        primary?: boolean;
        isOther?: boolean;
      }>;
    }
  }

  if (actions.length === 0) return null;

  // Added margin-bottom to ensure space between buttons and input
  return (
    <div className="w-full mb-16 mt-2 px-2 flex justify-end">
      <ActionButtons
        actions={actions}
        onActionClick={(value, isOther) => {
          // Complete the tool call only if it's still in call state
          if (toolInvocation.state === "call") {
            addToolResult({
              result: JSON.stringify({
                actions,
                message: "User selected an action",
                selectedAction: value,
                success: true
              }),
              toolCallId: toolInvocation.toolCallId
            });
          }

          // Then dispatch the event for the app to handle
          const event = new CustomEvent("action-button-clicked", {
            detail: {
              isOther: isOther,
              text: value
            }
          });
          window.dispatchEvent(event);
        }}
      />
    </div>
  );
}

// Multi-instance Chat - manages multiple project tabs
function Chat() {
  const { currentProject, projects } = useProject();

  return (
    <div className="h-full w-full">
      {/* Render all project tabs, but only show the active one */}
      {projects.map((project) => (
        <ProjectTab
          key={project.name}
          projectName={project.name}
          isActive={project.name === currentProject.name}
        />
      ))}
    </div>
  );
}

// Component for individual project tabs - each maintains its own agent instance
function ProjectTab({
  projectName,
  isActive
}: {
  projectName: string;
  isActive: boolean;
}) {
  const agentConfig = useProjectAuth(projectName);

  // Only call agent hooks when we have valid authentication
  const agentState = agentConfig ? 
    useAgentState(agentConfig, "onboarding") : 
    { agent: null, agentMode: "onboarding" as const, changeAgentMode: async () => {} };

  const { agent, agentMode, changeAgentMode } = agentState;

  if (!agentConfig) {
    return (
      <div
        style={{
          display: isActive ? "block" : "none",
          height: "100%",
          width: "100%"
        }}
      >
        <div>Loading project {projectName}...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: isActive ? "block" : "none",
        height: "100%",
        width: "100%"
      }}
    >
      <ProjectTabContent
        agentConfig={agentConfig}
        agent={agent}
        agentMode={agentMode}
        changeAgentMode={changeAgentMode}
      />
    </div>
  );
}

// The actual content of each project tab - contains the original Chat logic
function ProjectTabContent({
  agentConfig,
  agent,
  agentMode,
  changeAgentMode
}: {
  agentConfig: ReturnType<typeof useProjectAuth>;
  agent: ReturnType<typeof useAgentState>["agent"];
  agentMode: AgentMode;
  changeAgentMode: (mode: AgentMode) => Promise<void>;
}) {
  // Mobile viewport height fix
  useEffect(() => {
    // Only run on client and mobile
    if (typeof window === "undefined") return;
    if (window.innerWidth <= 768) {
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      };

      setViewportHeight();
      window.addEventListener("resize", setViewportHeight);
      window.addEventListener("orientationchange", () => {
        setTimeout(setViewportHeight, 100);
      });

      return () => {
        window.removeEventListener("resize", setViewportHeight);
        window.removeEventListener("orientationchange", setViewportHeight);
      };
    }
  }, []);

  // Add global error handlers for better error handling
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);

      // Check if it's a JSON parsing error
      if (event.reason?.message?.includes("JSON")) {
        console.error("JSON parsing error detected:", event.reason);
        // Prevent the error from causing a blank screen
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);

      // Check if it's a JSON parsing error
      if (event.error?.message?.includes("JSON")) {
        console.error("JSON parsing error detected:", event.error);
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener("error", handleError);
    };
  }, []);

  // UI-related state
  const { theme, toggleTheme } = useThemePreference();
  const [showDebug, setShowDebug] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "presentation">(
    "presentation"
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Add temporary loading state for smoother mode transitions
  const [temporaryLoading, setTemporaryLoading] = useState(false);
  // Thinking tokens state
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingTokens, setThinkingTokens] = useState<string>("");

  // Add auth context for token expiration checks
  const auth = useAuth();

  // Theme persistence and DOM classes are handled by useThemePreference

  // agentConfig, agent, agentState, agentMode, changeAgentMode are now passed as props from ProjectTab

  // Use the error handling hook
  const { isErrorMessage, parseErrorData, formatErrorForMessage } =
    useErrorHandling();

  const {
    messages: agentMessagesRaw,
    input: agentInput,
    handleInputChange: handleAgentInputChange,
    handleSubmit: handleAgentSubmit,
    addToolResult,
    clearHistory,
    data: agentData,
    setInput,
    setMessages,
    reload,
    isLoading,
    stop
  } = useAgentChat({
    agent: agent || undefined, // Pass undefined if agent is null to prevent WebSocket connection
    maxSteps: 5,
    onError: (error) => {
      console.error("Error while streaming:", error);
      console.log(
        "[ERROR HANDLER] Error details:",
        JSON.stringify(error, null, 2)
      );

      // Check if this is a tool validation error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isToolValidationError =
        errorMessage.includes("Invalid arguments for tool") &&
        errorMessage.includes("Type validation failed");

      if (isToolValidationError) {
        console.log(
          "[ERROR HANDLER] Tool validation error detected, creating synthetic tool call"
        );

        // Extract tool name from error message
        const toolNameMatch = errorMessage.match(
          /Invalid arguments for tool (\w+):/
        );
        const toolName = toolNameMatch ? toolNameMatch[1] : "unknown_tool";

        // Create a synthetic assistant message with failed tool call
        const syntheticMessage = {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          content: `I encountered a parameter validation error with the ${toolName} tool.`,
          createdAt: new Date(),
          parts: [
            {
              type: "tool-invocation" as const,
              toolInvocation: {
                toolCallId: `error-${Date.now()}`,
                toolName,
                state: "result" as const,
                args: {},
                result: {
                  success: false,
                  error: {
                    message: "Tool parameter validation failed",
                    details: errorMessage,
                    timestamp: new Date().toISOString()
                  }
                }
              }
            }
          ]
        };

        // Set this synthetic message instead of the error message
        setMessages([...agentMessages, syntheticMessage]);
        return; // Exit early to avoid the normal error handling
      }

      // Use values from the editing hook for error handling (normal error flow)
      console.log(
        `[Error] Error handler triggered, current messages length: ${agentMessages.length}, currentEditIndex: ${currentEditIndex}`
      );
      console.log(
        `[Error] Original values - length: ${originalMessagesLengthRef.current}, editIndex: ${originalEditIndexRef.current}`
      );

      // Create a new assistant message with the error (normal error flow)
      const formattedErrorMessage = formatErrorForMessage(error);

      // Initialize with current messages
      let currentMessages = [...agentMessages];

      // If we have an original edit index from a recent edit
      if (
        originalEditIndexRef.current !== null &&
        editedMessageContentRef.current
      ) {
        console.log(
          `[Error] Using original edit context, index: ${originalEditIndexRef.current}`
        );
        console.log(
          `[Error] Using stored edited content: "${editedMessageContentRef.current.substring(0, 30)}..."`
        );

        // We had an edit in progress - truncate to before the edit using ORIGINAL values
        const originalLength = currentMessages.length;
        const editIndex = originalEditIndexRef.current;

        currentMessages =
          editIndex > 0 ? agentMessages.slice(0, editIndex) : [];

        console.log(
          `[Error] Truncated from ${originalLength} to ${currentMessages.length} messages`
        );

        // Add the stored edited message (rather than whatever might be in the input)
        const editedMessageText = editedMessageContentRef.current;
        console.log(
          `[Error] Adding edited message: "${editedMessageText.substring(0, 30)}..."`
        );
        currentMessages.push({
          content: editedMessageText,
          createdAt: new Date(),
          id: crypto.randomUUID(),
          parts: [
            {
              text: editedMessageText,
              type: "text" as const
            }
          ],
          role: "user" as const
        });

        // Reset original refs
        originalEditIndexRef.current = null;
        originalMessagesLengthRef.current = 0;
        editedMessageContentRef.current = "";
      } else if (currentEditIndex !== null) {
        // Fallback to current edit index (for retry operations)
        console.log(
          `[Error] Using current edit context, index: ${currentEditIndex}`
        );

        // We're in the middle of editing - truncate to before the edit
        const originalLength = currentMessages.length;
        currentMessages =
          currentEditIndex > 0 ? agentMessages.slice(0, currentEditIndex) : [];

        console.log(
          `[Error] Truncated from ${originalLength} to ${currentMessages.length} messages`
        );

        // Also add the message being edited (from input)
        const editedMessageText = agentInput.trim();
        if (editedMessageText) {
          console.log(
            `[Error] Adding edited message from input: "${editedMessageText.substring(0, 30)}..."`
          );
          currentMessages.push({
            content: editedMessageText,
            createdAt: new Date(),
            id: crypto.randomUUID(),
            parts: [
              {
                text: editedMessageText,
                type: "text" as const
              }
            ],
            role: "user" as const
          });
        }

        // Reset editing state
        setCurrentEditIndex(null);
      } else {
        // For regular messages, make sure the user message is included
        const lastUserInput = agentInput.trim();
        const lastMessageIsUser =
          currentMessages.length > 0 &&
          currentMessages[currentMessages.length - 1].role === "user";

        if (lastUserInput && !lastMessageIsUser) {
          console.log(
            `[Error] Adding user message: "${lastUserInput.substring(0, 30)}..."`
          );
          // Add the user message that caused the error
          currentMessages.push({
            content: lastUserInput,
            createdAt: new Date(),
            id: crypto.randomUUID(),
            parts: [
              {
                text: lastUserInput,
                type: "text" as const
              }
            ],
            role: "user" as const
          });
        }
      }

      // Create a new error message with required format
      const newErrorMessage = {
        content: formattedErrorMessage,
        createdAt: new Date(),
        id: crypto.randomUUID(),
        parts: [
          {
            text: formattedErrorMessage,
            type: "text" as const
          }
        ],
        role: "assistant" as const
      };

      console.log(
        `[Error] Setting ${currentMessages.length + 1} messages (${currentMessages.length} + error message)`
      );

      // Add the error message to the messages
      setMessages([...currentMessages, newErrorMessage]);

      // Reset retry state
      setIsRetrying(false);

      // Clear any refs
      originalEditIndexRef.current = null;
      originalMessagesLengthRef.current = 0;
      editedMessageContentRef.current = "";
    }
  });

  // SAFETY: Ensure agentMessages is always an array to prevent "messages.map is not a function" errors
  // Also detect API errors and throw proper auth errors for the Error Boundary to catch
  const hasApiError =
    agentMessagesRaw &&
    typeof agentMessagesRaw === "object" &&
    !Array.isArray(agentMessagesRaw) &&
    "error" in agentMessagesRaw;

  if (hasApiError) {
    const errorMessage =
      agentMessagesRaw &&
      typeof agentMessagesRaw === "object" &&
      "error" in agentMessagesRaw
        ? (agentMessagesRaw as { error: string }).error
        : "Unknown API error";
    const authError = new Error(
      `Authentication failed: ${errorMessage}`
    ) as Error & { isAuthError?: boolean };
    authError.isAuthError = true; // Mark as auth error
    throw authError; // Throw immediately - prevents .map() from being called
  }

  // The backend now guarantees arrays, but this is a safety measure
  const agentMessages = Array.isArray(agentMessagesRaw) ? agentMessagesRaw : [];

  // Use the message editing hook to manage message editing and retry logic
  const {
    editingMessageId,
    editingValue,
    currentEditIndex,
    isRetrying,
    originalMessagesLengthRef,
    originalEditIndexRef,
    editedMessageContentRef,
    setEditingValue,
    setCurrentEditIndex,
    setIsRetrying,
    startEditing,
    cancelEditing,
    handleEditMessage,
    handleRetry,
    handleRetryLastUserMessage
  } = useMessageEditing(agentMessages, setMessages, agentInput, reload);

  // Listen for thinking tokens from agent data stream
  useEffect(() => {
    if (agentData && Array.isArray(agentData)) {
      // Check if we have thinking tokens data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const thinkingData = agentData.find(
        (data: any) => data?.type === "thinking-tokens"
      );
      if (
        thinkingData &&
        typeof thinkingData === "object" &&
        "content" in thinkingData &&
        typeof thinkingData.content === "string"
      ) {
        setIsThinking(true);
        setThinkingTokens(thinkingData.content);
      }
    }
  }, [agentData]);

  // Reset thinking state when loading stops
  useEffect(() => {
    if (!isLoading) {
      setIsThinking(false);
      setThinkingTokens("");
    }
  }, [isLoading]);

  // Token expiration wrapper functions
  const handleRetryWithTokenCheck = (index: number) => {
    if (auth?.checkTokenExpiration()) {
      return; // Token expired, user will be redirected to login
    }
    handleRetry(index);
  };

  const handleRetryLastUserMessageWithTokenCheck = () => {
    if (auth?.checkTokenExpiration()) {
      return; // Token expired, user will be redirected to login
    }
    handleRetryLastUserMessage();
  };

  // Update handleSubmitWithRetry to check token expiration
  const handleSubmitWithRetry = (e: React.FormEvent) => {
    if (auth?.checkTokenExpiration()) {
      return; // Token expired, user will be redirected to login
    }
    setIsRetrying(false); // Clear retrying state when sending a new message
    handleAgentSubmit(e);
  };

  // Add token expiration check to reload function wrapper
  const reloadWithTokenCheck = useCallback(() => {
    if (auth?.checkTokenExpiration()) {
      return; // Token expired, user will be redirected to login
    }
    reload();
  }, [auth, reload]);

  // Export conversation handler
  const handleExportConversation = useCallback(async () => {
    const markdownContent = exportConversationToMarkdown(agentMessages);
    const success = await copyToClipboard(markdownContent);

    if (!success) {
      throw new Error("Failed to copy conversation to clipboard");
    }
  }, [agentMessages]);

  // Handle custom event for setting chat input from PresentationPanel
  useEffect(() => {
    // Function to set input and switch to chat tab if needed
    function handleSetChatInput(event: CustomEvent) {
      if (event.detail?.text) {
        const selectedText = event.detail.text;

        // Check token expiration before proceeding
        if (auth?.checkTokenExpiration()) {
          return; // Token expired, user will be redirected to login
        }

        // If we're not in chat tab, switch to it
        if (activeTab !== "chat") {
          setActiveTab("chat");
        }

        // Set the input value first (needed for compatibility with input validation)
        setInput(selectedText);

        // Then create a synthetic form submit event
        setTimeout(() => {
          // Create a new user message
          const newMessage = {
            content: selectedText,
            createdAt: new Date(),
            id: crypto.randomUUID(),
            parts: [
              {
                text: selectedText,
                type: "text" as const
              }
            ],
            role: "user" as const
          };

          // Add the message to the chat
          setMessages([...agentMessages, newMessage]);

          // Clear the input field
          setInput("");

          // Trigger the agent to respond with token check
          setTimeout(() => {
            reloadWithTokenCheck();
          }, 50);
        }, 10);
      }
    }

    // Add event listener
    window.addEventListener(
      "set-chat-input",
      handleSetChatInput as EventListener
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        "set-chat-input",
        handleSetChatInput as EventListener
      );
    };
  }, [
    setInput,
    activeTab,
    agentMessages,
    reloadWithTokenCheck,
    auth,
    setMessages
  ]);

  // Handle action button clicks from the suggestActions tool
  useEffect(() => {
    function handleActionButtonClick(event: CustomEvent) {
      if (event.detail && event.detail.text !== undefined) {
        const selectedText = event.detail.text;
        const isOther = event.detail.isOther === true;

        // If the user selects the "Other" option, just focus the input field
        if (isOther) {
          // Focus the input field for custom entry
          setTimeout(() => {
            // Find the textarea element directly (more reliable than using ref)
            const textareas = document.querySelectorAll("textarea");
            if (textareas.length > 0) {
              const textarea = textareas[0];
              textarea.focus();
              // Optional: Add a slight delay to ensure focus works after UI updates
              setTimeout(() => {
                textarea.focus();
              }, 100);
            }
          }, 50);
          return;
        }

        // For non-Other options, directly add a user message with the selected text
        if (selectedText) {
          // Check token expiration before proceeding
          if (auth?.checkTokenExpiration()) {
            return; // Token expired, user will be redirected to login
          }

          // Set the input value first (needed for compatibility with input validation)
          setInput(selectedText);

          // Then create a synthetic form submit event
          setTimeout(() => {
            // Create a new user message
            const newMessage = {
              content: selectedText,
              createdAt: new Date(),
              id: crypto.randomUUID(),
              parts: [
                {
                  text: selectedText,
                  type: "text" as const
                }
              ],
              role: "user" as const
            };

            // Add the message to the chat
            setMessages([...agentMessages, newMessage]);

            // Clear the input field
            setInput("");

            // Trigger the agent to respond with token check
            setTimeout(() => {
              reloadWithTokenCheck();
            }, 50);
          }, 10);
        }
      }
    }

    // Add event listener
    window.addEventListener(
      "action-button-clicked",
      handleActionButtonClick as EventListener
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        "action-button-clicked",
        handleActionButtonClick as EventListener
      );
    };
  }, [setMessages, agentMessages, setInput, auth, reloadWithTokenCheck]);

  // Reset textarea height when input is empty
  useEffect(() => {
    if (agentInput === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [agentInput]);

  // Handle empty chat state with a loading indicator
  useEffect(() => {
    // If we have no messages but the agent is connected, show a loading indicator
    // This helps with the initial loading experience for new chatrooms
    if (
      agent &&
      Array.isArray(agentMessages) &&
      agentMessages.length === 0 &&
      !isLoading
    ) {
      setTemporaryLoading(true);

      // Set a timeout to clear the loading state if no messages arrive
      const timeout = setTimeout(() => {
        setTemporaryLoading(false);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [agent, agentMessages, isLoading]);

  // Single simplified auto-response for system messages (welcome or transition)
  useEffect(() => {
    if (
      Array.isArray(agentMessages) &&
      agentMessages.length > 0 &&
      !isLoading &&
      !temporaryLoading
    ) {
      const lastMessage = agentMessages[agentMessages.length - 1];

      // Check if last message is a system message with isModeMessage data
      if (lastMessage.role === "system") {
        const messageData = lastMessage.data;
        const isModeMessage =
          messageData &&
          typeof messageData === "object" &&
          "isModeMessage" in messageData;

        if (isModeMessage) {
          // Trigger AI response just like a user sent a message
          reloadWithTokenCheck();
        }
      }
    }
  }, [agentMessages, isLoading, temporaryLoading, reloadWithTokenCheck]);

  // Early return for missing agent config (after all hooks are called)
  if (!agentConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-black to-blue-900 dark:from-blue-900 dark:via-black dark:to-blue-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Loading...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
        </div>
      </div>
    );
  }

  const pendingToolCallConfirmation = agentMessages.some((m: Message) =>
    m.parts?.some(
      (part) =>
        part.type === "tool-invocation" &&
        part.toolInvocation.state === "call" &&
        toolsRequiringConfirmation.includes(
          part.toolInvocation.toolName as keyof ToolTypes
        )
    )
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Handle message rendering loop
  const renderMessages = () => {
    // SAFETY: Double-check that agentMessages is a valid array
    if (!Array.isArray(agentMessages) || agentMessages.length === 0) {
      return <EmptyChat />;
    }

    // Render all regular messages
    const messageElements = agentMessages.map((message: Message, index) => {
      // Common variable setup
      const isUser = message.role === "user";
      const isMessageError = isErrorMessage(message);
      const isEditing = editingMessageId === message.id;
      const isSystemMessage = message.role === "system";

      // Special handling for error messages
      if (isMessageError && !isUser) {
        const errorData = parseErrorData(message);

        return (
          <div key={message.id}>
            <ErrorMessage
              errorData={errorData}
              onRetry={() => handleRetryWithTokenCheck(index)}
              isLoading={isLoading}
              formatTime={formatTime}
              createdAt={message.createdAt}
            />
          </div>
        );
      }

      // For user messages or system messages, use our ChatMessage component
      if (isUser || isSystemMessage) {
        return (
          <ChatMessage
            key={message.id}
            message={message}
            index={index}
            isEditing={isEditing}
            editingValue={editingValue}
            onStartEditing={startEditing}
            onCancelEditing={cancelEditing}
            onSaveEdit={handleEditMessage}
            onEditingValueChange={setEditingValue}
            formatTime={formatTime}
            showDebug={showDebug}
          />
        );
      }

      // For assistant messages with multiple parts
      return (
        <div key={message.id} className="mb-4">
          {showDebug && (
            <pre className="text-sm text-muted-foreground overflow-scroll mb-2">
              {JSON.stringify(message, null, 2)}
            </pre>
          )}

          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[85%] flex-row">
              <Avatar username={"AI"} />

              <div className="space-y-3">
                {/* Render each part in sequence */}
                {message.parts?.map((part, i) => {
                  // For text parts
                  if (part.type === "text") {
                    return (
                      <div
                        key={`${message.id}-text-${part.text?.substring(0, 10) || i}`}
                      >
                        <Card className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-900 rounded-bl-none border-assistant-border">
                          <div className="text-base markdown-content">
                            <MemoizedMarkdown
                              id={`${message.id}-${i}`}
                              content={part.text || ""}
                            />
                          </div>
                        </Card>
                      </div>
                    );
                  }

                  // For tool invocation parts
                  if (part.type === "tool-invocation") {
                    const toolInvocation = part.toolInvocation;
                    const toolCallId = toolInvocation.toolCallId;
                    const needsConfirmation =
                      toolsRequiringConfirmation.includes(
                        toolInvocation.toolName as keyof ToolTypes
                      ) && toolInvocation.state === "call";

                    // Skip suggestActions invocations since they are handled separately
                    if (toolInvocation.toolName === "suggestActions") {
                      return null;
                    }

                    return (
                      <ToolInvocationCard
                        key={`${message.id}-tool-${toolCallId}`}
                        toolInvocation={toolInvocation}
                        toolCallId={toolCallId}
                        needsConfirmation={needsConfirmation}
                        addToolResult={addToolResult}
                      />
                    );
                  }

                  return null;
                })}

                {/* Timestamp for the entire message */}
                <p className="text-xs text-muted-foreground mt-1 text-left">
                  {formatTime(new Date(message.createdAt as unknown as string))}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    });

    // Check if the last message is from the user with no assistant response
    if (!isLoading && !isRetrying && agentMessages.length > 0) {
      const lastMessage = agentMessages[agentMessages.length - 1];
      const isLastMessageFromUser = lastMessage.role === "user";

      if (isLastMessageFromUser) {
        messageElements.push(
          <div key="missing-response">
            <MissingResponseIndicator
              onTryAgain={handleRetryLastUserMessageWithTokenCheck}
              isLoading={isLoading}
              formatTime={formatTime}
            />
          </div>
        );
      }
    }

    // Check if there's an assistant message currently being streamed
    const isCurrentlyStreaming =
      agentMessages.length > 0 &&
      agentMessages[agentMessages.length - 1].role === "assistant" &&
      (agentMessages[agentMessages.length - 1].parts?.find(
        (part) => part.type === "text"
      )?.text?.length || 0) > 0;

    // If we're loading (waiting for a response), show a typing indicator
    // But only if we're not already streaming an assistant message
    if ((isLoading || temporaryLoading) && !isCurrentlyStreaming) {
      // Show loading indicator when isLoading is true or temporaryLoading is set
      // but not when there's already an assistant message being streamed
      messageElements.push(
        <div key="loading-indicator">
          <LoadingIndicator
            formatTime={formatTime}
            isThinking={isThinking && !!thinkingTokens}
            thinkingTokens={thinkingTokens}
          />
        </div>
      );
    }

    // Add warning for disconnected state
    const typedAgentData = agentData as unknown as AgentData;
    if (
      typeof typedAgentData?.connectionStatus === "string" &&
      (typedAgentData.connectionStatus === "disconnected" ||
        typedAgentData.connectionStatus === "error" ||
        typedAgentData.connectionStatus === "reconnecting")
    ) {
      messageElements.push(
        <div key="connection-warning" className="flex justify-center my-4">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm flex items-center gap-2 text-red-800 dark:text-red-300 max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
              role="img"
              aria-label="Warning icon"
            >
              <title>Warning</title>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              {typedAgentData.connectionStatus === "disconnected" &&
                "Connection lost. Trying to reconnect..."}
              {typedAgentData.connectionStatus === "error" &&
                "Connection error. Trying to reconnect..."}
              {typedAgentData.connectionStatus === "reconnecting" &&
                "Reconnecting..."}
            </span>
          </div>
        </div>
      );
    }

    // Add suggested actions at the end of messages
    messageElements.push(
      <SuggestedActions
        key="suggested-actions"
        messages={agentMessages}
        addToolResult={addToolResult}
        reload={reloadWithTokenCheck}
      />
    );

    return messageElements;
  };

  // Update the clearHistory function to properly handle post-clear welcome messages
  const handleClearHistory = () => {
    // Clear the history first
    clearHistory();

    // Reset retrying state
    setIsRetrying(false);

    // Use a temporary loading indicator for better UX
    // We need this because clearing history doesn't naturally trigger the isLoading state
    // This gives visual feedback that something is happening
    setTemporaryLoading(true);
    setTimeout(() => setTemporaryLoading(false), 1500);

    // After clearing, refresh the current mode to generate a welcome message
    if (changeAgentMode) {
      changeAgentMode(agentMode);
    }
  };

  // Floating chat and controls (background rendered at App level)
  return (
    <div className="relative w-full h-[calc(var(--vh,1vh)*100)] overflow-hidden">
      {/* Floating chat launcher (mobile: corner button, desktop: corner button) */}
      {activeTab !== "chat" && (
        <div className="fixed bottom-4 right-4 z-[60]">
          <button
            type="button"
            aria-label="Open chat"
            className="bg-[#F48120] text-white font-semibold py-3 px-5 rounded-full shadow-xl text-base hover:bg-[#F48120]/90 transition-colors"
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </button>
        </div>
      )}

      {/* Floating Chat Container - mobile: full screen, desktop: corner panel */}
      <div
        className={`fixed inset-0 md:absolute md:left-auto md:right-6 md:bottom-8 md:w-[520px] md:h-[75vh] md:inset-auto overflow-hidden z-[70] ${
          activeTab === "chat" ? "block" : "hidden"
        }`}
      >
        <div className="h-full md:mx-0 md:rounded-lg overflow-hidden shadow-2xl border border-neutral-300 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-black/70">
          <ChatContainer
            theme={theme}
            showDebug={showDebug}
            agentMode={agentMode}
            inputValue={agentInput}
            isLoading={isLoading}
            isThinking={isThinking}
            pendingConfirmation={pendingToolCallConfirmation}
            activeTab={"chat"}
            onToggleTheme={toggleTheme}
            onToggleDebug={() => setShowDebug((prev) => !prev)}
            onChangeMode={(newMode) => {
              setTemporaryLoading(true);
              setTimeout(() => setTemporaryLoading(false), 1500);
              changeAgentMode(newMode);
            }}
            onClearHistory={handleClearHistory}
            onExportConversation={handleExportConversation}
            onInputChange={handleAgentInputChange}
            onInputSubmit={(e) => {
              handleSubmitWithRetry(e);
            }}
            onStop={stop}
            onCloseChat={() => setActiveTab("presentation")}
          >
            {renderMessages()}
          </ChatContainer>
        </div>
      </div>

      {/* Mobile Tabs hidden; chat controlled by FAB */}
    </div>
  );
}

// Main App component with authentication - includes styling wrapper
export default function App() {
  return (
    <div className="bg-neutral-50 text-base text-neutral-900 antialiased transition-colors selection:bg-blue-700 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
      <div
        className="bg-gradient-to-br from-blue-100 via-white to-blue-100 dark:from-blue-900 dark:via-black dark:to-blue-900"
        style={{ height: "calc(var(--vh, 1vh) * 100)" }}
      >
        <ErrorBoundary>
          <AuthProvider>
            <ProjectProvider>
              <AppContent />
            </ProjectProvider>
          </AuthProvider>
        </ErrorBoundary>
      </div>
    </div>
  );
}

// App content that has access to project context
function AppContent() {
  return (
    <div className="relative w-full h-[calc(var(--vh,1vh)*100)] overflow-auto">
      {/* Background Presentation Panel - always visible */}
      <div className="absolute inset-0 z-50">
        <BackgroundPresentationPanel />
      </div>
      {/* Always-available theme toggle when unauthenticated */}
      <RootThemeToggle />
      {/* Auth overlay and authenticated content */}
      <AuthGuard>
        {/* Floating profile + theme toggle container - mobile: sticky top bar, desktop: corner */}
        <AuthenticatedTopPanel />
        <Chat />
      </AuthGuard>
    </div>
  );
}

// Background presentation panel that shows with or without agent state
function BackgroundPresentationPanel() {
  const auth = useAuth();

  // If not authenticated, show presentation panel without agent state
  if (!auth?.authMethod) {
    return (
      <PresentationContainer
        activeTab="presentation"
        agentMode={"onboarding" as const}
        agentState={null}
        showDebug={false}
        variant="full"
      />
    );
  }

  // If authenticated, show presentation panel with agent state
  return <AuthenticatedPresentationPanel />;
}

// Component that renders the presentation panel with agent state when authenticated
function AuthenticatedPresentationPanel() {
  // Get authenticated agent configuration for current project
  const agentConfig = useCurrentProjectAuth();

  // Use the agent state hook
  const { agentState, agentMode } = useAgentState(agentConfig, "onboarding");

  return (
    <PresentationContainer
      activeTab="presentation"
      agentMode={agentMode}
      agentState={agentState}
      showDebug={false}
      variant="full"
    />
  );
}

function RootThemeToggle() {
  const auth = useAuth();
  const { theme, toggleTheme } = useThemePreference();
  if (auth?.authMethod) return null;
  return (
    <div className="fixed top-4 right-4 z-[60] pr-2 md:pr-4 flex items-center gap-2">
      <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
    </div>
  );
}

function AuthenticatedTopPanel() {
  const auth = useAuth();
  const { theme, toggleTheme } = useThemePreference();
  const agentConfig = useCurrentProjectAuth();
  const { agentMode } = useAgentState(agentConfig, "onboarding");
  const [_showDebug, _setShowDebug] = useState(false);
  const [activeTab, _setActiveTab] = useState<"chat" | "presentation">(
    "presentation"
  );

  // Only render if authenticated
  if (!auth?.authMethod) {
    return null;
  }

  return (
    <div
      className={`sticky top-0 md:fixed md:top-4 md:right-4 md:left-auto z-[60] md:z-[80] bg-white/90 dark:bg-black/90 md:!bg-transparent backdrop-blur-sm md:!backdrop-blur-none border-b border-neutral-200 dark:border-neutral-800 md:border-none px-4 py-3 md:p-0 md:pr-4 flex items-center justify-between md:justify-start gap-2 ${activeTab === "chat" ? "md:flex hidden" : "flex"}`}
    >
      <div className="flex items-center gap-2">
        <div className="order-0 md:order-0">
          <ProjectSelector />
        </div>
        <button
          type="button"
          aria-label="Toggle theme"
          className="rounded-full h-10 w-10 md:h-9 md:w-9 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 order-2 md:order-1"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="order-1 md:order-2">
          <UserProfile />
        </div>
      </div>
      {/* Mobile: show current mode */}
      <div className="md:hidden text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
        {agentMode}
      </div>
    </div>
  );
}
