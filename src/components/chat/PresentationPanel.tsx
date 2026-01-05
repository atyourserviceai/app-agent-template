import { useRef } from "react";
import { BallCanvas, type BallCanvasHandle } from "../../balls";
import type { AgentMode, AppAgentState } from "../../agent/AppAgent";

interface PresentationPanelProps {
  agentState: AppAgentState;
  agentMode: AgentMode;
  showDebug: boolean;
}

export function PresentationPanel({
  agentState,
  showDebug
}: PresentationPanelProps) {
  const canvasRef = useRef<BallCanvasHandle>(null);

  // Determine theme based on document class
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  // Get ball count from canvas ref (fallback to 0)
  const ballCount = canvasRef.current?.getState().balls.length ?? 0;
  const isPaused = canvasRef.current?.getState().paused ?? false;

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
            {isPaused && (
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                Paused
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Click to add balls, drag to throw. Gravity shifts every 5 seconds.
        </p>
      </div>

      {/* Ball Canvas */}
      <div className="flex-1 relative">
        <BallCanvas
          ref={canvasRef}
          theme={isDark ? "dark" : "light"}
          className="absolute inset-0"
        />
      </div>

      {/* Debug Info */}
      {showDebug && (
        <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <pre className="text-xs text-neutral-500 overflow-auto max-h-24">
            {JSON.stringify(canvasRef.current?.getState() ?? {}, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
