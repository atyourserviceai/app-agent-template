import { useRef, useEffect } from "react";
import { BallCanvas, type BallCanvasHandle } from "../../balls";
import type { AgentMode, AppAgentState } from "../../agent/AppAgent";
import type { BallState } from "../../balls/types";

interface PresentationPanelProps {
  agentState: AppAgentState;
  agentMode: AgentMode;
  showDebug: boolean;
  onBallStateChange?: (ballState: BallState) => void;
}

export function PresentationPanel({
  agentState,
  agentMode,
  showDebug,
  onBallStateChange
}: PresentationPanelProps) {
  const canvasRef = useRef<BallCanvasHandle>(null);

  // Sync ball state from agent state to canvas
  useEffect(() => {
    if (canvasRef.current && agentState.ballState) {
      // The canvas maintains its own internal state for physics
      // We just need to sync when state changes from the agent
    }
  }, [agentState.ballState]);

  // Determine theme based on document class
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <div className="h-full bg-white dark:bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Ball Simulation
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>
              {agentState.ballState?.balls.length || 0} balls
            </span>
            {agentState.ballState?.paused && (
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                Paused
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Ask the AI to add balls, change gravity, or control the simulation
        </p>
      </div>

      {/* Ball Canvas */}
      <div className="flex-1 relative">
        <BallCanvas
          ref={canvasRef}
          initialState={agentState.ballState}
          onStateChange={onBallStateChange}
          theme={isDark ? "dark" : "light"}
          className="absolute inset-0"
        />
      </div>

      {/* Debug Info */}
      {showDebug && agentState.ballState && (
        <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <pre className="text-xs text-neutral-500 overflow-auto max-h-24">
            {JSON.stringify(agentState.ballState, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
