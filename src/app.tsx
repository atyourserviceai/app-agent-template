import type { Message } from "@ai-sdk/react";
import { useAgentChat } from "agents/ai-react";
import { useEffect, useRef, useState } from "react";
import type { ToolTypes } from "./agent/tools/types";
import { useAgentState } from "./hooks/useAgentState";
import { useAgentAuth } from "./hooks/useAgentAuth";
import { useErrorHandling } from "./hooks/useErrorHandling";
import { useMessageEditing } from "./hooks/useMessageEditing";

import { Avatar } from "@/components/avatar/Avatar";
// Component imports
import { Card } from "@/components/card/Card";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatTabs } from "@/components/chat/ChatTabs";
import { EmptyChat } from "@/components/chat/EmptyChat";
import { ErrorMessage } from "@/components/chat/ErrorMessage";
import { LoadingIndicator } from "@/components/chat/LoadingIndicator";
import { MissingResponseIndicator } from "@/components/chat/MissingResponseIndicator";
import { PlaybookContainer } from "@/components/chat/PlaybookContainer";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ToolInvocationCard } from "@/components/tool-invocation-card/ToolInvocationCard";
import { ActionButtons } from "@/components/action-buttons/ActionButtons";
// Auth components
import { AuthProvider } from "./components/auth/AuthProvider";
import { AuthGuard } from "./components/auth/AuthGuard";

// Define agent data interface for typing
interface AgentData {
  connectionStatus?: "connected" | "disconnected" | "error" | "reconnecting";
  [key: string]: unknown;
}

// List of tools that require human confirmation
const toolsRequiringConfirmation: (keyof ToolTypes)[] = [
  "getWeatherInformation",
  // Do not add suggestActions here as we want it to display without confirmation
];

// Add this new component to show suggested actions above the chat input
function SuggestedActions({
  messages,
  addToolResult,
  reload,
}: {
  messages: Message[];
  addToolResult: (args: { toolCallId: string; result: string }) => void;
  reload: () => void;
}) {
  // Find the latest message with suggestActions
  const lastAssistantMessage = [...messages]
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
              toolCallId: toolInvocation.toolCallId,
              result: JSON.stringify({
                success: true,
                selectedAction: value,
                message: "User selected an action",
                actions,
              }),
            });
          }

          // Then dispatch the event for the app to handle
          const event = new CustomEvent("action-button-clicked", {
            detail: {
              text: value,
              isOther: isOther,
            },
          });
          window.dispatchEvent(event);
        }}
      />
    </div>
  );
}

function Chat() {
  // UI-related state
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    // Check localStorage first, default to dark if not found
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const [showDebug, setShowDebug] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "playbook">("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Add temporary loading state for smoother mode transitions
  const [temporaryLoading, setTemporaryLoading] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  useEffect(() => {
    // Apply theme class on mount and when theme changes
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }

    // Save theme preference to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Get authenticated agent configuration
  const agentConfig = useAgentAuth();

  // Use the agent state hook with authenticated config
  const { agent, agentState, agentMode, changeAgentMode } = useAgentState(
    "onboarding",
    agentConfig
  );

  // Use the error handling hook
  const { isErrorMessage, parseErrorData, formatErrorForMessage } =
    useErrorHandling();

  // Debug effect to log dropdown values on every render
  useEffect(() => {
    console.log(
      `[UI Debug] Dropdown values - agentMode: ${agentMode}, agentState?.mode: ${agentState?.mode || "none"}`
    );
  }, [agentMode, agentState]);

  const {
    messages: agentMessages,
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
  } = useAgentChat({
    agent,
    maxSteps: 5,
    onError: (error) => {
      console.error("Error while streaming:", error);
      console.log(
        "[ERROR HANDLER] Error details:",
        JSON.stringify(error, null, 2)
      );
      console.log("[ERROR HANDLER] Error type:", typeof error);
      console.log(
        "[ERROR HANDLER] Error keys:",
        error ? Object.keys(error) : "no keys"
      );
      console.log(
        "[ERROR HANDLER] Error message:",
        error instanceof Error ? error.message : String(error)
      );
      console.log(
        "[ERROR HANDLER] Error stack:",
        error instanceof Error ? error.stack : "no stack"
      );

      // Use values from the editing hook for error handling
      console.log(
        `[Error] Error handler triggered, current messages length: ${agentMessages.length}, currentEditIndex: ${currentEditIndex}`
      );
      console.log(
        `[Error] Original values - length: ${originalMessagesLengthRef.current}, editIndex: ${originalEditIndexRef.current}`
      );

      // Create a new assistant message with the error
      const errorMessage = formatErrorForMessage(error);

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
          id: crypto.randomUUID(),
          role: "user" as const,
          createdAt: new Date(),
          content: editedMessageText,
          parts: [
            {
              type: "text" as const,
              text: editedMessageText,
            },
          ],
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
            id: crypto.randomUUID(),
            role: "user" as const,
            createdAt: new Date(),
            content: editedMessageText,
            parts: [
              {
                type: "text" as const,
                text: editedMessageText,
              },
            ],
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
            id: crypto.randomUUID(),
            role: "user" as const,
            createdAt: new Date(),
            content: lastUserInput,
            parts: [
              {
                type: "text" as const,
                text: lastUserInput,
              },
            ],
          });
        }
      }

      // Create a new error message with required format
      const newErrorMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        createdAt: new Date(),
        content: errorMessage,
        parts: [
          {
            type: "text" as const,
            text: errorMessage,
          },
        ],
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
    },
  });

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
    handleRetryLastUserMessage,
  } = useMessageEditing(agentMessages, setMessages, agentInput, reload);

  // Handle custom event for setting chat input from PlaybookPanel
  useEffect(() => {
    // Function to set input and switch to chat tab if needed
    function handleSetChatInput(event: CustomEvent) {
      if (event.detail) {
        setInput(event.detail.text || "");
        // If we're not in chat tab, switch to it
        if (activeTab !== "chat") {
          setActiveTab("chat");
        }
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
  }, [setInput, activeTab]);

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
          // Set the input value first (needed for compatibility with input validation)
          setInput(selectedText);

          // Then create a synthetic form submit event
          setTimeout(() => {
            // Create a new user message
            const newMessage = {
              id: crypto.randomUUID(),
              role: "user" as const,
              createdAt: new Date(),
              content: selectedText,
              parts: [
                {
                  type: "text" as const,
                  text: selectedText,
                },
              ],
            };

            // Add the message to the chat
            setMessages([...agentMessages, newMessage]);

            // Clear the input field
            setInput("");

            // Trigger the agent to respond
            setTimeout(() => {
              reload();
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
  }, [setMessages, agentMessages, setInput, reload]);

  // Reset textarea height when input is empty
  useEffect(() => {
    if (agentInput === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [agentInput]);

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
    if (agentMessages.length === 0) {
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
              onRetry={() => handleRetry(index)}
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
              onTryAgain={handleRetryLastUserMessage}
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
          <LoadingIndicator formatTime={formatTime} />
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
        reload={reload}
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

    // After clearing, force refresh the current mode to generate a welcome message
    if (changeAgentMode) {
      console.log("[UI] Refreshing mode after clearing history");

      // Pass true for both force and isAfterClearHistory
      // The isAfterClearHistory flag is critical to ensure proper behavior:
      // - On page reload, the agent's onConnect method ensures a welcome message
      // - When clearing history, we don't trigger onConnect, so we need this flag
      // - This makes the mode transition create a fresh welcome message
      // - Without this flag, clearing history would leave an empty chat with no welcome message
      changeAgentMode(agentMode, true, true);
    }
  };

  // Update handleSubmitWithRetry to properly handle options
  const handleSubmitWithRetry = (e: React.FormEvent) => {
    setIsRetrying(false); // Clear retrying state when sending a new message
    handleAgentSubmit(e);
  };

  // Handle empty chat state with a loading indicator
  useEffect(() => {
    // If we have no messages but the agent is connected, show a loading indicator
    // This helps with the initial loading experience for new chatrooms
    if (agent && agentMessages.length === 0 && !isLoading) {
      setTemporaryLoading(true);

      // Set a timeout to clear the loading state if no messages arrive
      const timeout = setTimeout(() => {
        setTemporaryLoading(false);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [agent, agentMessages.length, isLoading]);

  // Single simplified auto-response for system messages (welcome or transition)
  useEffect(() => {
    if (agentMessages.length > 0 && !isLoading && !temporaryLoading) {
      const lastMessage = agentMessages[agentMessages.length - 1];

      // Check if last message is a system message with isModeMessage data
      if (lastMessage.role === "system") {
        const messageData = lastMessage.data;
        const isModeMessage =
          messageData &&
          typeof messageData === "object" &&
          "isModeMessage" in messageData;

        if (isModeMessage) {
          console.log(
            `[UI] Auto-triggering AI response for ${messageData.modeType} message`
          );
          // Trigger AI response just like a user sent a message
          reload();
        }
      }
    }
  }, [agentMessages, isLoading, temporaryLoading, reload]);

  return (
    <div className="h-[100vh] w-full p-4 flex justify-center items-center overflow-hidden">
      {/* Main Container - Responsive layout with chat and playbook */}
      <div className="h-[calc(100vh-2rem)] w-full mx-auto max-w-7xl flex flex-col md:flex-row md:space-x-4 pb-14 md:pb-0">
        {/* Chat UI */}
        <ChatContainer
          theme={theme}
          showDebug={showDebug}
          agentMode={agentMode}
          inputValue={agentInput}
          isLoading={isLoading}
          pendingConfirmation={pendingToolCallConfirmation}
          activeTab={activeTab}
          onToggleTheme={toggleTheme}
          onToggleDebug={() => setShowDebug((prev) => !prev)}
          onChangeMode={(newMode) => {
            // Use a temporary loading indicator for better UX
            // We need this because mode changes don't naturally trigger the isLoading state
            // since they don't involve an AI response - they're just UI state changes
            // This gives visual feedback that something is happening
            setTemporaryLoading(true);
            setTimeout(() => setTemporaryLoading(false), 1500);
            changeAgentMode(newMode);
          }}
          onClearHistory={handleClearHistory}
          onInputChange={handleAgentInputChange}
          onInputSubmit={(e) => {
            handleSubmitWithRetry(e);
          }}
        >
          {renderMessages()}
        </ChatContainer>

        {/* Playbook Panel */}
        <PlaybookContainer
          activeTab={activeTab}
          agentMode={agentMode}
          agentState={agentState}
          showDebug={showDebug}
        />
      </div>

      {/* Mobile Tabs at the bottom */}
      <ChatTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

// Main App component with authentication
export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-100 dark:from-blue-900 dark:via-black dark:to-blue-900">
      <AuthProvider>
        <AuthGuard>
          <Chat />
        </AuthGuard>
      </AuthProvider>
    </div>
  );
}
