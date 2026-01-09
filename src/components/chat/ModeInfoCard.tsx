import { Robot } from "@phosphor-icons/react";
import type { AgentMode } from "../../agent/AppAgent";

interface ModeInfoCardProps {
  agentMode: AgentMode;
}

/**
 * ModeInfoCard - Displays mode-specific information and features
 * This is shown above the presentation panel and includes full mode information
 */
export function ModeInfoCard({ agentMode }: ModeInfoCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-[#F48120]/10 text-[#F48120] rounded-full p-2 inline-flex">
          <Robot size={20} />
        </div>
        <h3 className="font-semibold text-lg">
          {agentMode === "plan" && "Plan Mode"}
          {agentMode === "act" && "Act Mode"}
        </h3>
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {agentMode === "plan" &&
          "Let me help you analyze tasks and create strategic plans. Try asking about:"}
        {agentMode === "act" &&
          "Ready to execute tasks and take action. I can help you:"}
      </p>

      <div className="text-sm space-y-2">
        {agentMode === "plan" && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[#F48120]">•</span>
              <span>Break down complex tasks into manageable steps</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F48120]">•</span>
              <span>Create strategic approaches to problems</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F48120]">•</span>
              <span>Analyze requirements and resources</span>
            </div>
          </>
        )}

        {agentMode === "act" && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[#F48120]">•</span>
              <span>Execute planned tasks and actions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F48120]">•</span>
              <span>Interact with external systems and services</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F48120]">•</span>
              <span>Take concrete steps toward achieving goals</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
