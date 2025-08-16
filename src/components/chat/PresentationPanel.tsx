import { ClipboardText } from "@phosphor-icons/react";
import { useState, useId } from "react";
import { Card } from "@/components/card/Card";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import type { AgentMode, AppAgentState } from "../../agent/AppAgent";

interface PresentationPanelProps {
  agentState: AppAgentState;
  agentMode: AgentMode;
  showDebug: boolean;
}

declare global {
  interface Window {
    setChatInput: (input: string) => void;
  }
}

export function PresentationPanel({
  agentState,
  agentMode,
  showDebug,
}: PresentationPanelProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const agentSettingsId = useId();

  // Function to copy text to clipboard
  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  // Function to set chat input (dispatch event consumed at App level)
  const setChatInput = (input: string) => {
    window.dispatchEvent(
      new CustomEvent("set-chat-input", { detail: { text: input } })
    );
  };

  // Check if we have any meaningful content to display
  const hasSettings =
    agentState?.settings &&
    (agentState.settings.language ||
      (agentState.settings.operators &&
        agentState.settings.operators.length > 0) ||
      agentState.settings.adminContact?.name);

  const hasAnyContent = hasSettings || agentState.isOnboardingComplete;

  const formatSettings = () => {
    if (!hasSettings) return "";

    let settingsInfo = "";
    const settings = agentState.settings!;

    if (settings.language) {
      settingsInfo += `## Language\n**${settings.language}**\n\n`;
    }

    if (settings.operators && settings.operators.length > 0) {
      settingsInfo += "## Operators\n";
      settings.operators.forEach((operator, index) => {
        settingsInfo += `### ${index + 1}. ${operator.name}\n`;
        settingsInfo += `**Role:** ${operator.role}\n`;
        if (operator.email) settingsInfo += `**Email:** ${operator.email}\n`;
        settingsInfo += "\n";
      });
    }

    if (settings.adminContact?.name) {
      settingsInfo += "## Admin Contact\n";
      settingsInfo += `### ${settings.adminContact.name}\n`;
      if (settings.adminContact.email) {
        settingsInfo += `**Email:** ${settings.adminContact.email}\n`;
      }
    }

    return settingsInfo;
  };

  // Enriched fullscreen context: descriptions, quick actions and simple stats
  const modeDescription: Record<AgentMode, string> = {
    onboarding:
      "Set up the agent’s purpose, defaults and operators. Finish onboarding to unlock deeper integrations.",
    integration:
      "Connect tools, run checks and document capabilities. Ensure everything is safe before acting.",
    plan: "Analyze context and propose next steps without executing tools. Iterate safely before acting.",
    act: "Execute approved actions with guardrails and visibility via the gateway.",
  };

  const quickActionsByMode: Record<
    AgentMode,
    Array<{ label: string; prompt: string }>
  > = {
    onboarding: [
      { label: "Set language", prompt: "Set language to English" },
      {
        label: "Add operator",
        prompt: "Add operator Alice (alice@example.com) as Analyst",
      },
      {
        label: "Define purpose",
        prompt: "Define the agent purpose for product research",
      },
    ],
    integration: [
      { label: "List tools", prompt: "List available tools and their status" },
      {
        label: "Run tests",
        prompt: "Run integration tests for configured tools",
      },
      { label: "Document a tool", prompt: "Document the 'fetchWebPage' tool" },
    ],
    plan: [
      {
        label: "Summarize context",
        prompt: "Summarize current context and known inputs",
      },
      {
        label: "Propose next steps",
        prompt: "Propose next 3 steps and assumptions",
      },
      {
        label: "Risk check",
        prompt: "List risks and mitigations before execution",
      },
    ],
    act: [
      { label: "Execute task", prompt: "Execute the top recommended action" },
      {
        label: "Schedule",
        prompt: "Schedule a follow-up task for tomorrow 9am",
      },
      { label: "Export data", prompt: "Export current agent data as backup" },
    ],
  };

  const quickActions = quickActionsByMode[agentMode] || [];
  const onboardingComplete = !!agentState.isOnboardingComplete;
  const integrationComplete = !!agentState.isIntegrationComplete;
  const testCount = agentState.testResults
    ? Object.keys(agentState.testResults).length
    : 0;
  const lastModeChange = agentState._lastModeChange
    ? new Date(agentState._lastModeChange)
    : null;

  return (
    <div className="h-full bg-white dark:bg-neutral-900 p-3 md:p-4 overflow-auto">
      {/* Hero / mode banner with quick stats and actions */}
      <div className="relative overflow-hidden rounded-xl p-4 md:p-6 lg:p-8 mb-4 bg-gradient-to-br from-neutral-100/80 to-neutral-200/60 dark:from-neutral-900/60 dark:to-neutral-800/40 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-white dark:bg-white dark:text-neutral-900">
              <span>Mode</span>
              <span className="opacity-80">•</span>
              <span className="capitalize">{agentMode}</span>
            </div>
            <h2 className="mt-3 text-xl md:text-2xl lg:text-3xl font-semibold text-neutral-900 dark:text-white">
              {agentMode === "onboarding" && "Welcome—let's set you up"}
              {agentMode === "integration" && "Validate and connect tools"}
              {agentMode === "plan" && "Think before you act"}
              {agentMode === "act" && "Execute with confidence"}
            </h2>
            <p className="mt-2 text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-2xl">
              {modeDescription[agentMode]}
            </p>
          </div>

          {/* Stats grid - mobile: 2 cols, desktop: 3 cols */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            <div className="rounded-lg px-2 md:px-3 py-2 bg-white/80 dark:bg-neutral-900/60 ring-1 ring-black/5 dark:ring-white/10">
              <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Onboarding
              </p>
              <p className="text-xs md:text-sm font-semibold text-neutral-900 dark:text-white">
                {onboardingComplete ? "Complete" : "In progress"}
              </p>
            </div>
            <div className="rounded-lg px-2 md:px-3 py-2 bg-white/80 dark:bg-neutral-900/60 ring-1 ring-black/5 dark:ring-white/10">
              <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Integration
              </p>
              <p className="text-xs md:text-sm font-semibold text-neutral-900 dark:text-white">
                {integrationComplete ? "Complete" : `${testCount} tests`}
              </p>
            </div>
            <div className="rounded-lg px-2 md:px-3 py-2 bg-white/80 dark:bg-neutral-900/60 ring-1 ring-black/5 dark:ring-white/10 md:col-auto col-span-2">
              <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Last change
              </p>
              <p className="text-xs md:text-sm font-semibold text-neutral-900 dark:text-white">
                {lastModeChange ? lastModeChange.toLocaleString() : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions - mobile: scrollable, desktop: wrap */}
        {(() => {
          return quickActions.length > 0 ? (
            <div className="mt-4 flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible pb-2 md:pb-0">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  type="button"
                  className="flex-shrink-0 px-3 py-1.5 text-sm rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity whitespace-nowrap"
                  onClick={() => {
                    setChatInput(qa.prompt);
                  }}
                >
                  {qa.label}
                </button>
              ))}
            </div>
          ) : null;
        })()}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <ClipboardText size={18} className="text-neutral-500 md:w-5 md:h-5" />
        <h3 className="text-sm md:text-base font-medium">
          Agent Configuration
        </h3>
      </div>

      {!hasAnyContent && (
        <div className="text-center py-8">
          <div className="text-neutral-500 dark:text-neutral-400 mb-4">
            <ClipboardText size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-lg font-medium mb-2">No Configuration Yet</p>
            <p className="text-sm">
              Start by configuring your agent in onboarding mode
            </p>
          </div>

          {agentMode !== "onboarding" && (
            <button
              type="button"
              className="px-4 py-2 bg-[#F48120] text-white rounded-md hover:bg-[#F48120]/90 transition-colors"
              onClick={() => {
                setChatInput("Switch to onboarding mode");
              }}
            >
              Go to Onboarding
            </button>
          )}
        </div>
      )}

      {hasAnyContent && (
        <div className="space-y-4">
          {/* Agent Settings */}
          {hasSettings && (
            <Card className="p-4 bg-neutral-100 dark:bg-neutral-900">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Agent Settings</h3>
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800"
                  onClick={() => copyToClipboard(formatSettings(), "settings")}
                >
                  {copiedSection === "settings" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="markdown-content text-sm max-h-[300px] overflow-auto">
                <MemoizedMarkdown
                  id={agentSettingsId}
                  content={formatSettings()}
                />
              </div>
            </Card>
          )}

          {/* Progress & Health */}
          <Card className="p-4 bg-neutral-100 dark:bg-neutral-900">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Progress & Health</h3>
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-2 h-2 rounded-full ${agentState.isOnboardingComplete ? "bg-green-500" : "bg-yellow-500"}`}
                />
                <span>
                  Onboarding:{" "}
                  {agentState.isOnboardingComplete ? "Complete" : "In Progress"}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-2 h-2 rounded-full ${agentState.isIntegrationComplete ? "bg-green-500" : "bg-gray-400"}`}
                />
                <span>
                  Integration:{" "}
                  {agentState.isIntegrationComplete
                    ? "Complete"
                    : `Pending (${testCount} tests)`}
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                Current step: {agentState.onboardingStep || "start"}
              </p>
            </div>
          </Card>

          {/* Raw State (Debug Mode Only) */}
          {showDebug && (
            <Card className="p-4 bg-neutral-100 dark:bg-neutral-900">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Raw Agent State</h3>
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(agentState, null, 2),
                      "raw-state"
                    )
                  }
                >
                  {copiedSection === "raw-state" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="text-sm">
                <pre className="bg-neutral-200 dark:bg-neutral-800 p-2 rounded overflow-auto text-xs max-h-[500px]">
                  {JSON.stringify(agentState, null, 2)}
                </pre>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
