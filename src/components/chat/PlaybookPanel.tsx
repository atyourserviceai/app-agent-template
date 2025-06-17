import { Card } from "@/components/card/Card";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ClipboardText } from "@phosphor-icons/react";
import { useState } from "react";
import type { AgentMode, AppAgentState } from "../../agent/AppAgent";

interface PlaybookPanelProps {
  agentState: AppAgentState;
  agentMode: AgentMode;
  showDebug: boolean;
}

declare global {
  interface Window {
    setChatInput: (input: string) => void;
  }
}

export function PlaybookPanel({
  agentState,
  agentMode,
  showDebug,
}: PlaybookPanelProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Function to copy text to clipboard
  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  // Function to set chat input
  const setChatInput = (input: string) => {
    if (window.setChatInput) {
      window.setChatInput(input);
    }
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

  return (
    <div className="h-full bg-white dark:bg-neutral-900 p-4 overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardText size={20} className="text-neutral-500" />
        <h2 className="text-lg font-medium">Agent Configuration</h2>
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
              onClick={() => setChatInput("Switch to onboarding mode")}
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
                  id="agent-settings"
                  content={formatSettings()}
                />
              </div>
            </Card>
          )}

          {/* Onboarding Status */}
          <Card className="p-4 bg-neutral-100 dark:bg-neutral-900">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Setup Status</h3>
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
                  {agentState.isIntegrationComplete ? "Complete" : "Pending"}
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
