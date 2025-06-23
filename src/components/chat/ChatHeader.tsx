import { Button } from "@/components/button/Button";
import { Toggle } from "@/components/toggle/Toggle";
import { Bug, Moon, Sun, Trash } from "@phosphor-icons/react";
import type { AgentMode } from "../../agent/AppAgent";
import { UserProfile } from "../auth/UserProfile";

type ChatHeaderProps = {
  theme: "dark" | "light";
  showDebug: boolean;
  agentMode: AgentMode;
  onToggleTheme: () => void;
  onToggleDebug: () => void;
  onChangeMode: (mode: AgentMode) => void;
  onClearHistory: () => void;
};

export function ChatHeader({
  theme,
  showDebug,
  agentMode,
  onToggleTheme,
  onToggleDebug,
  onChangeMode,
  onClearHistory,
}: ChatHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 flex items-center gap-3 sticky top-0 z-10 bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-center h-8 w-8">
        <svg
          width="28px"
          height="28px"
          className="text-[#F48120]"
          data-icon="agents"
        >
          <title>Cloudflare Agents</title>
          <symbol id="ai:local:agents" viewBox="0 0 80 79">
            <path
              fill="currentColor"
              d="M69.3 39.7c-3.1 0-5.8 2.1-6.7 5H48.3V34h4.6l4.5-2.5c1.1.8 2.5 1.2 3.9 1.2 3.8 0 7-3.1 7-7s-3.1-7-7-7-7 3.1-7 7c0 .9.2 1.8.5 2.6L51.9 30h-3.5V18.8h-.1c-1.3-1-2.9-1.6-4.5-1.9h-.2c-1.9-.3-3.9-.1-5.8.6-.4.1-.8.3-1.2.5h-.1c-.1.1-.2.1-.3.2-1.7 1-3 2.4-4 4 0 .1-.1.2-.1.2l-.3.6c0 .1-.1.1-.1.2v.1h-.6c-2.9 0-5.7 1.2-7.7 3.2-2.1 2-3.2 4.8-3.2 7.7 0 .7.1 1.4.2 2.1-1.3.9-2.4 2.1-3.2 3.5s-1.2 2.9-1.4 4.5c-.1 1.6.1 3.2.7 4.7s1.5 2.9 2.6 4c-.8 1.8-1.2 3.7-1.1 5.6 0 1.9.5 3.8 1.4 5.6s2.1 3.2 3.6 4.4c1.3 1 2.7 1.7 4.3 2.2v-.1q2.25.75 4.8.6h.1c0 .1.1.1.1.1.9 1.7 2.3 3 4 4 .1.1.2.1.3.2h.1c.4.2.8.4 1.2.5 1.4.6 3 .8 4.5.7.4 0 .8-.1 1.3-.1h.1c1.6-.3 3.1-.9 4.5-1.9V62.9h3.5l3.1 1.7c-.3.8-.5 1.7-.5 2.6 0 3.8 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7c-1.5 0-2.8.5-3.9 1.2l-4.6-2.5h-4.6V48.7h14.3c.9 2.9 3.5 5 6.7 5 3.8 0 7-3.1 7-7s-3.1-7-7-7m-7.9-16.9c1.6 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.4-3 3-3m0 41.4c1.6 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.4-3 3-3M44.3 72c-.4.2-.7.3-1.1.3-.2 0-.4.1-.5.1h-.2c-.9.1-1.7 0-2.6-.3-1-.3-1.9-.9-2.7-1.7-.7-.8-1.3-1.7-1.6-2.7l-.3-1.5v-.7q0-.75.3-1.5c.1-.2.1-.4.2-.7s.3-.6.5-.9c0-.1.1-.1.1-.2.1-.1.1-.2.2-.3s.1-.2.2-.3c0 0 0-.1.1-.1l.6-.6-2.7-3.5c-1.3 1.1-2.3 2.4-2.9 3.9-.2.4-.4.9-.5 1.3v.1c-.1.2-.1.4-.1.6-.3 1.1-.4 2.3-.3 3.4-.3 0-.7 0-1-.1-2.2-.4-4.2-1.5-5.5-3.2-1.4-1.7-2-3.9-1.8-6.1q.15-1.2.6-2.4l.3-.6c.1-.2.2-.4.3-.5 0 0 0-.1.1-.1.4-.7.9-1.3 1.5-1.9 1.6-1.5 3.8-2.3 6-2.3q1.05 0 2.1.3v-4.5c-.7-.1-1.4-.2-2.1-.2-1.8 0-3.5.4-5.2 1.1-.7.3-1.3.6-1.9 1s-1.1.8-1.7 1.3c-.3.2-.5.5-.8.8-.6-.8-1-1.6-1.3-2.6-.2-1-.2-2 0-2.9.2-1 .6-1.9 1.3-2.6.6-.8 1.4-1.4 2.3-1.8l1.8-.9-.7-1.9c-.4-1-.5-2.1-.4-3.1s.5-2.1 1.1-2.9q.9-1.35 2.4-2.1c.9-.5 2-.8 3-.7.5 0 1 .1 1.5.2 1 .2 1.8.7 2.6 1.3s1.4 1.4 1.8 2.3l4.1-1.5c-.9-2-2.3-3.7-4.2-4.9q-.6-.3-.9-.6c.4-.7 1-1.4 1.6-1.9.8-.7 1.8-1.1 2.9-1.3.9-.2 1.7-.1 2.6 0 .4.1.7.2 1.1.3V72zm25-22.3c-1.6 0-3-1.3-3-3 0-1.6 1.3-3 3-3s3 1.3 3 3c0 1.6-1.3 3-3 3"
            />
          </symbol>
          <use href="#ai:local:agents" />
        </svg>
      </div>

      <div className="flex-1">
        <h2 className="font-semibold text-base">Foo Agent</h2>
      </div>

      {/* Mode selector */}
      <div className="flex items-center gap-2">
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

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="md"
        shape="square"
        className="rounded-full h-9 w-9"
        onClick={onToggleTheme}
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </Button>

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

      {/* User Profile */}
      <UserProfile />
    </div>
  );
}
