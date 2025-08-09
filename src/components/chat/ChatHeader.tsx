import { Bug, Trash, X } from "@phosphor-icons/react";
import { useId } from "react";
import { Button } from "@/components/button/Button";
import { Toggle } from "@/components/toggle/Toggle";
import type { AgentMode } from "../../agent/AppAgent";

type ChatHeaderProps = {
  theme: "dark" | "light";
  showDebug: boolean;
  agentMode: AgentMode;
  onToggleTheme: () => void;
  onToggleDebug: () => void;
  onChangeMode: (mode: AgentMode) => void;
  onClearHistory: () => void;
  onCloseChat?: () => void;
};

export function ChatHeader({
  theme,
  showDebug,
  agentMode,
  onToggleTheme,
  onToggleDebug,
  onChangeMode,
  onClearHistory,
  onCloseChat,
}: ChatHeaderProps) {
  const agentIconId = useId();

  return (
    <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900">
      <div className="flex-1 min-w-0" />

      {/* Mode selector */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Hidden debug element for logging mode - using key to force re-render */}
        <div key={`debug-${agentMode}`} style={{ display: "none" }} />
        <select
          className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1 text-sm"
          value={agentMode}
          onChange={(e) => onChangeMode(e.target.value as AgentMode)}
        >
          <option value="onboarding">Onboarding Mode</option>
          <option value="integration">Integration Mode</option>
          <option value="plan">Plan Mode</option>
          <option value="act">Act Mode</option>
        </select>
      </div>

      {/* Debug toggle */}
      <div className="hidden md:flex items-center gap-2 mr-2">
        <Bug size={16} />
        <Toggle
          toggled={showDebug}
          aria-label="Toggle debug mode"
          onClick={onToggleDebug}
        />
      </div>

      {/* Theme toggle moved to top-right of app */}

      {/* Clear history */}
      <Button
        variant="ghost"
        size="md"
        shape="square"
        className="rounded-full h-9 w-9"
        onClick={onClearHistory}
      >
        <Trash size={20} />
      </Button>

      {/* Close chat (floating panel use) */}
      {onCloseChat && (
        <Button
          variant="ghost"
          size="lg"
          shape="square"
          className="rounded-full h-10 w-10 flex items-center justify-center"
          onClick={onCloseChat}
          aria-label="Close chat"
          title="Close"
        >
          <X size={20} />
        </Button>
      )}
    </div>
  );
}
