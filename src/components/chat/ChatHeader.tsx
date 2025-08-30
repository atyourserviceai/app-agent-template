import { Bug, Trash, X, Copy } from "@phosphor-icons/react";
import { Button } from "@/components/button/Button";
import { Toggle } from "@/components/toggle/Toggle";
import type { AgentMode } from "../../agent/AppAgent";
import { useEnvironment } from "../../contexts/EnvironmentContext";
import { useState } from "react";

type ChatHeaderProps = {
  theme: "dark" | "light";
  showDebug: boolean;
  agentMode: AgentMode;
  onToggleTheme: () => void;
  onToggleDebug: () => void;
  onChangeMode: (mode: AgentMode) => void;
  onClearHistory: () => void;
  onExportConversation?: () => Promise<void>;
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
  onExportConversation,
  onCloseChat
}: ChatHeaderProps) {
  const { isDev } = useEnvironment();
  const [exportStatus, setExportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleExport = async () => {
    if (!onExportConversation) return;

    try {
      await onExportConversation();
      setExportStatus("success");
      setTimeout(() => setExportStatus("idle"), 2000);
    } catch (_error) {
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 2000);
    }
  };

  return (
    <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900">
      {/* Left side: Action buttons */}
      <div className="flex items-center gap-2">
        {/* Export conversation */}
        {onExportConversation && (
          <div className="relative">
            <Button
              variant="ghost"
              size="md"
              shape="square"
              className="rounded-full h-9 w-9"
              onClick={handleExport}
              disabled={exportStatus !== "idle"}
              aria-label="Export conversation"
            >
              <Copy size={20} />
            </Button>

            {/* Success popup */}
            {exportStatus === "success" && (
              <div
                className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-3 py-2 rounded-md shadow-lg"
                style={{ zIndex: 9999 }}
              >
                Copied to clipboard!
              </div>
            )}

            {/* Error popup */}
            {exportStatus === "error" && (
              <div
                className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-sm px-3 py-2 rounded-md shadow-lg"
                style={{ zIndex: 9999 }}
              >
                Export failed
              </div>
            )}
          </div>
        )}

        {/* Clear history */}
        <Button
          variant="ghost"
          size="md"
          shape="square"
          className="rounded-full h-9 w-9"
          onClick={onClearHistory}
          aria-label="Clear conversation history"
        >
          <Trash size={20} />
        </Button>
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

      {/* Right side: Debug toggle and close chat */}
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
    </div>
  );
}
