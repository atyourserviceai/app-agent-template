import type { Message } from "@ai-sdk/react";
import { useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { CopyButton } from "@/components/chat/CopyButton";
import { MemoizedMarkdown } from "@/components/memoized-markdown";

// Custom type for mode message data
interface ModeMessageData {
  isModeMessage: boolean;
  modeType: "welcome" | "transition";
  targetMode: string;
  fromMode?: string;
}

type ChatMessageProps = {
  message: Message;
  index: number;
  isEditing: boolean;
  editingValue: string;
  onStartEditing: (message: Message) => void;
  onCancelEditing: () => void;
  onSaveEdit: (index: number) => void;
  onEditingValueChange: (value: string) => void;
  formatTime: (date: Date) => string;
  showDebug?: boolean;
  thinkingTokens?: string;
};

export function ChatMessage({
  message,
  index,
  isEditing,
  editingValue,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onEditingValueChange,
  formatTime,
  showDebug = false,
  thinkingTokens
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [showThinking, setShowThinking] = useState(false);
  const [touchTimeout, setTouchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Find the first text part for display
  const textPart = message.parts?.find((p) => p.type === "text");
  const messageText = textPart?.text || "";

  // Check if it's a scheduled message
  const isScheduledMessage = messageText.startsWith("scheduled message");

  // Check if it's a mode message
  const messageData = message.data as ModeMessageData | undefined;
  const isModeMessage = messageData?.isModeMessage === true;
  const modeType = isModeMessage ? messageData.modeType : null;

  // Remove any HTML comments from the message (these are just instructions for the AI)
  const cleanMessageText = messageText.replace(/<!--.*?-->/gs, "");

  // Touch handlers for mobile long-press edit
  const handleTouchStart = () => {
    if (isUser && !isEditing) {
      const timeout = setTimeout(() => {
        onStartEditing(message);
      }, 500); // 500ms long press
      setTouchTimeout(timeout);
    }
  };

  const handleTouchEnd = () => {
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
  };

  const handleTouchMove = () => {
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
  };

  // If it's a mode message, use a special system notification style
  if (isModeMessage) {
    // Different styling based on the type of mode message
    const bgColors = {
      transition:
        "from-amber-50/90 to-amber-100/90 dark:from-amber-950/90 dark:to-amber-900/90",
      welcome:
        "from-blue-50/90 to-blue-100/90 dark:from-blue-950/90 dark:to-blue-900/90"
    };

    const borderColors = {
      transition: "border-amber-300 dark:border-amber-700",
      welcome: "border-blue-300 dark:border-blue-700"
    };

    return (
      <div className="flex justify-center my-4">
        <Card
          className={`
            px-4 py-3 max-w-[85%] bg-gradient-to-r
            ${modeType ? bgColors[modeType] : bgColors.welcome}
            border border-dashed
            ${modeType ? borderColors[modeType] : borderColors.welcome}
            transition-all duration-300 ease-in-out
            hover:shadow-md dark:hover:shadow-neutral-800
          `}
        >
          <div className="text-center text-base markdown-content">
            <MemoizedMarkdown
              id={`mode-${message.id}`}
              content={cleanMessageText}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {showDebug && (
        <div className="w-full mb-2">
          <pre className="text-sm text-muted-foreground overflow-scroll p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md">
            {JSON.stringify(message, null, 2)}
          </pre>
        </div>
      )}
      <div
        className={`flex gap-2 max-w-[85%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {!isUser && <Avatar username={"AI"} />}

        <div className="w-full">
          {/* If editing this message */}
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editingValue}
                onChange={(e) => onEditingValueChange(e.target.value)}
                className="mb-2 w-full py-3 px-4 text-base rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[150px]"
                rows={6}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onSaveEdit(index)}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelEditing}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="relative group"
              role={isUser ? "button" : undefined}
              tabIndex={isUser ? 0 : undefined}
              // Double-click to edit user messages
              onDoubleClick={isUser ? () => onStartEditing(message) : undefined}
              // Touch handlers for mobile long-press edit
              onTouchStart={isUser ? handleTouchStart : undefined}
              onTouchEnd={isUser ? handleTouchEnd : undefined}
              onTouchMove={isUser ? handleTouchMove : undefined}
              style={{ cursor: isUser ? "pointer" : undefined }}
            >
              <Card
                className={`p-3 rounded-md bg-neutral-100 dark:bg-neutral-900 ${
                  isUser
                    ? "rounded-br-none"
                    : "rounded-bl-none border-assistant-border"
                } ${isScheduledMessage ? "border-accent/50" : ""} relative`}
              >
                {isScheduledMessage && (
                  <span className="absolute -top-3 -left-2 text-base">🕒</span>
                )}
                <div className="text-base markdown-content">
                  <MemoizedMarkdown
                    id={`msg-${message.id}`}
                    content={cleanMessageText.replace(
                      /^scheduled message: /,
                      ""
                    )}
                  />
                </div>
              </Card>

              {/* Thinking tokens display for assistant messages */}
              {!isUser && thinkingTokens && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowThinking(!showThinking)}
                    className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1"
                    title="Toggle AI thinking process"
                  >
                    <span>🧠</span>
                    <span>
                      {showThinking ? "Hide" : "Show"} thinking process
                    </span>
                  </button>
                  {showThinking && (
                    <Card className="mt-2 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="text-xs text-amber-800 dark:text-amber-200 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {thinkingTokens}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center mt-1">
                <p
                  className={`text-sm text-muted-foreground ${
                    isUser ? "text-right" : "text-left"
                  }`}
                >
                  {formatTime(new Date(message.createdAt as unknown as string))}
                </p>
                <CopyButton messageText={cleanMessageText} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
