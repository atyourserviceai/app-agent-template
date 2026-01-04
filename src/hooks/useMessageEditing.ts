import type { ExtendedUIMessage } from "@/shared";

// Use ExtendedUIMessage which includes data and createdAt
type Message = ExtendedUIMessage;
import { useRef, useState } from "react";

export function useMessageEditing(
  messages: Message[],
  setMessages: (messages: Message[]) => void,
  _input: string,
  reload: () => void | Promise<string | null | undefined>
) {
  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Refs to track message state before editing
  const originalMessagesLengthRef = useRef<number>(0);
  const originalEditIndexRef = useRef<number | null>(null);
  const editedMessageContentRef = useRef<string>("");

  // Helper: Start editing a message
  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    // Find the first text part for editing
    const textPart = message.parts?.find((p) => p.type === "text");
    setEditingValue(textPart?.text || "");
  };

  // Helper: Cancel editing
  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingValue("");
  };

  // Helper: Save edit and update chat history
  const handleEditMessage = async (messageIndex: number) => {
    // Store the original message length, edit index, and edited content
    originalMessagesLengthRef.current = messages.length;
    originalEditIndexRef.current = messageIndex;
    editedMessageContentRef.current = editingValue; // Save the actual edited content

    // Get the edited message text
    const editedText = editingValue;

    console.log(
      `[Edit] Starting edit for message at index ${messageIndex}, current messages length: ${messages.length}`
    );
    console.log(`[Edit] Edited content: "${editedText.substring(0, 30)}..."`);

    // Clear editing state
    setEditingMessageId(null);
    setEditingValue("");

    try {
      // Keep track of which message we're editing (for error handling)
      setCurrentEditIndex(messageIndex);

      // Get all messages up to (but not including) the edited message
      const previousMessages =
        messageIndex > 0 ? messages.slice(0, messageIndex) : [];

      console.log(
        `[Edit] Truncated to ${previousMessages.length} messages, adding edited message`
      );

      // Create new user message with edited content
      const newUserMessage = {
        content: editedText,
        createdAt: new Date(),
        id: crypto.randomUUID(),
        parts: [
          {
            text: editedText,
            type: "text" as const
          }
        ],
        role: "user" as const
      };

      // Set messages with both the previous messages and the new edited message
      setMessages([...previousMessages, newUserMessage]);

      console.log("[Edit] Updated messages, calling reload()");

      // Now trigger the AI response
      await reload();
    } catch (error) {
      console.error("Error handling message edit:", error);
    } finally {
      // Clear the editing state, but DO NOT clear refs yet
      setCurrentEditIndex(null);
    }
  };

  // Retry an error message by finding the user message before it
  const handleRetry = async (errorMessageIndex: number) => {
    console.log(
      `[Retry] Starting retry for error at index ${errorMessageIndex}`
    );

    // Find the user message that came right before this error
    let userMessageIndex = -1;
    let systemMessageIndex = -1;

    // Look for the closest user message before the error
    for (let i = errorMessageIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userMessageIndex = i;
        break;
      }
      if (messages[i].role === "system" && systemMessageIndex === -1) {
        // Track the first system message we find (nearest to the error)
        systemMessageIndex = i;
      }
    }

    // If we found a user message, use it for retry
    if (userMessageIndex !== -1) {
      // Get the user message content
      const userMessage = messages[userMessageIndex];
      const textPart = userMessage.parts?.find((p) => p.type === "text");
      const userMessageContent = textPart?.text || "";

      if (!userMessageContent) {
        console.log(
          `[Retry] No content in user message at index ${userMessageIndex}`
        );
        return; // No content to retry
      }

      // Store original state for error handling
      originalMessagesLengthRef.current = messages.length;
      originalEditIndexRef.current = userMessageIndex;
      editedMessageContentRef.current = userMessageContent; // Store the content

      console.log(
        `[Retry] Retrying message at index ${userMessageIndex}, content: "${userMessageContent.substring(0, 30)}..."`
      );

      setIsRetrying(true);

      try {
        // Set the edit index (for error handling)
        setCurrentEditIndex(userMessageIndex);

        // Get all messages up to (but not including) the user message
        const previousMessages =
          userMessageIndex > 0 ? messages.slice(0, userMessageIndex) : [];

        console.log(
          `[Retry] Truncated to ${previousMessages.length} messages, adding user message`
        );

        // Create a new user message with the same content
        const newUserMessage = {
          content: userMessageContent,
          createdAt: new Date(),
          id: crypto.randomUUID(),
          parts: [
            {
              text: userMessageContent,
              type: "text" as const
            }
          ],
          role: "user" as const
        };

        // Set messages with both the previous messages and the user message
        setMessages([...previousMessages, newUserMessage]);

        console.log("[Retry] Updated messages, calling reload()");

        // Trigger the AI response
        await reload();
      } catch (error) {
        console.error("Error during retry:", error);
      } finally {
        setIsRetrying(false);
        setCurrentEditIndex(null);
        // Don't clear original refs - let the error handler do that if needed
      }
    }
    // Special case: System welcome message but no user message
    else if (systemMessageIndex !== -1) {
      console.log(
        `[Retry] Found system message at index ${systemMessageIndex} but no user message. Using system-only retry flow.`
      );

      // Check if it's a welcome/transition message with isModeMessage data property
      const systemMessage = messages[systemMessageIndex];
      const isModeMessage =
        systemMessage.data &&
        typeof systemMessage.data === "object" &&
        "isModeMessage" in systemMessage.data;

      if (isModeMessage) {
        console.log(
          "[Retry] System message is a mode message. Triggering AI response directly."
        );

        // Store original state for error handling
        originalMessagesLengthRef.current = messages.length;
        originalEditIndexRef.current = null; // No user message to edit
        editedMessageContentRef.current = ""; // No content to store

        setIsRetrying(true);

        try {
          // Keep all messages up to the error (excluding the error)
          const previousMessages =
            errorMessageIndex > 0 ? messages.slice(0, errorMessageIndex) : [];

          // Just keep the system message(s), nothing more
          setMessages(previousMessages);

          console.log(
            `[Retry] Keeping system messages only (${previousMessages.length}), calling reload()`
          );

          // Trigger the AI response directly, with no user message
          await reload();
        } catch (error) {
          console.error("Error during system-message retry:", error);
        } finally {
          setIsRetrying(false);
          setCurrentEditIndex(null);
        }
      } else {
        console.log(
          "[Retry] System message is not a mode message. Cannot retry."
        );
      }
    } else {
      console.log(
        `[Retry] No user or system message found before error at index ${errorMessageIndex}`
      );
    }
  };

  // Retry the last user message
  const handleRetryLastUserMessage = async () => {
    if (messages.length === 0) return;

    // Get the index of the last user message
    const lastUserIndex = messages.length - 1;

    // Make sure it's actually a user message
    if (messages[lastUserIndex].role !== "user") return;

    // Get the content of the last user message
    const userMessage = messages[lastUserIndex];
    const textPart = userMessage.parts?.find((p) => p.type === "text");
    const userMessageContent = textPart?.text || "";

    if (!userMessageContent) return;

    // Store original state for error handling
    originalMessagesLengthRef.current = messages.length;
    originalEditIndexRef.current = lastUserIndex;
    editedMessageContentRef.current = userMessageContent;

    console.log(
      `[Retry Last] Retrying last user message at index ${lastUserIndex}`
    );

    setIsRetrying(true);

    try {
      // Keep all messages including the last user message
      // Unlike handleRetry which truncates before the message
      const allMessages = [...messages];

      // Set the current edit index for error handling
      setCurrentEditIndex(lastUserIndex);

      console.log(`[Retry Last] Kept all ${allMessages.length} messages`);

      // Just trigger a reload without changing the messages
      await reload();
    } catch (error) {
      console.error("Error retrying last message:", error);
    } finally {
      setIsRetrying(false);
      setCurrentEditIndex(null);
    }
  };

  return {
    cancelEditing,
    currentEditIndex,
    editedMessageContentRef,
    // State
    editingMessageId,
    editingValue,
    handleEditMessage,
    handleRetry,
    handleRetryLastUserMessage,
    isRetrying,
    originalEditIndexRef,

    // Refs (exposed for error handling)
    originalMessagesLengthRef,
    setCurrentEditIndex,

    // Actions
    setEditingValue,
    setIsRetrying,
    startEditing
  };
}
