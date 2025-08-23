import type { FormEvent, ReactNode } from "react";
import type { AgentMode } from "../../agent/AppAgent";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";

type ChatContainerProps = {
  theme: "dark" | "light";
  showDebug: boolean;
  agentMode: AgentMode;
  inputValue: string;
  isLoading: boolean;
  pendingConfirmation: boolean;
  activeTab: "chat" | "presentation";
  children: ReactNode;
  suggestedActionsComponent?: ReactNode;
  onToggleTheme: () => void;
  onToggleDebug: () => void;
  onChangeMode: (mode: AgentMode) => void;
  onClearHistory: () => void;
  onExportConversation?: () => Promise<void>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onInputSubmit: (e: FormEvent) => void;
  onCloseChat?: () => void; // optional close handler when used as floating panel
};

export function ChatContainer({
  theme,
  showDebug,
  agentMode,
  inputValue,
  isLoading,
  pendingConfirmation,
  activeTab,
  children,
  suggestedActionsComponent,
  onToggleTheme,
  onToggleDebug,
  onChangeMode,
  onClearHistory,
  onExportConversation,
  onInputChange,
  onInputSubmit,
  onCloseChat,
}: ChatContainerProps) {
  return (
    <div
      className={`h-full min-h-0 w-full flex-shrink-0 flex flex-col shadow-xl rounded-md overflow-hidden relative border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-black ${
        activeTab === "chat" ? "block" : "hidden md:flex"
      }`}
    >
      {/* Header */}
      <ChatHeader
        theme={theme}
        showDebug={showDebug}
        agentMode={agentMode}
        onToggleTheme={onToggleTheme}
        onToggleDebug={onToggleDebug}
        onChangeMode={onChangeMode}
        onClearHistory={onClearHistory}
        onExportConversation={onExportConversation}
        onCloseChat={onCloseChat}
      />

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <MessageList>{children}</MessageList>
      </div>

      {/* Suggested actions */}
      {suggestedActionsComponent}

      {/* Input */}
      <ChatInput
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onInputSubmit}
        isLoading={isLoading}
        pendingConfirmation={pendingConfirmation}
      />
    </div>
  );
}
