import { Bug, Trash, X } from "@phosphor-icons/react";
import { Button } from "@/components/button/Button";
import { Toggle } from "@/components/toggle/Toggle";
import type { AgentMode } from "../../agent/AppAgent";
import { useEnvironment } from "../../contexts/EnvironmentContext";

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
  theme: _theme,
  showDebug,
  agentMode,
  onToggleTheme: _onToggleTheme,
  onToggleDebug,
  onChangeMode,
  onClearHistory,
  onCloseChat,
}: ChatHeaderProps) {
  const { isDev } = useEnvironment();

  return (
    <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900">
      {/* Left side: Close button */}
      <div className="flex items-center gap-2">
        {/* Close chat - show on mobile, hide on desktop when no onCloseChat provided */}
        {onCloseChat && (
          <Button
            variant="ghost"
            size="md"
            shape="square"
            className="rounded-full h-9 w-9 flex items-center justify-center"
            onClick={onCloseChat}
            aria-label="Close chat"
            title="Close"
          >
            <X size={18} />
          </Button>
        )}
      </div>

      {/* Center: Mode selector */}
      <div className="flex items-center gap-2">
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

      {/* Right side: Debug toggle and clear history */}
      <div className="flex items-center gap-2">
        {/* Debug toggle - only show in dev environment */}
        {isDev && (
          <div className="hidden md:flex items-center gap-2">
            <Bug size={16} />
            <Toggle
              toggled={showDebug}
              aria-label="Toggle debug mode"
              onClick={onToggleDebug}
            />
          </div>
        )}

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
      </div>
    </div>
  );
}
