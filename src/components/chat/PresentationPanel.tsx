import { useRef, useEffect, useState } from "react";
import { BallCanvas, type BallCanvasHandle } from "../../balls";
import type { AgentMode, AppAgentState } from "../../agent/AppAgent";
import { Moon, Sun, X } from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthProvider";
import { UserProfile } from "../auth/UserProfile";
import { AnonymousProfile } from "../auth/AnonymousProfile";
import { useThemePreference } from "../../hooks/useThemePreference";

interface PresentationPanelProps {
  agentState: AppAgentState;
  agentMode: AgentMode;
  showDebug: boolean;
  onShowLandingPage?: () => void;
}

export function PresentationPanel({
  agentState,
  showDebug,
  onShowLandingPage
}: PresentationPanelProps) {
  const canvasRef = useRef<BallCanvasHandle>(null);
  const processedCommandsRef = useRef<Set<string>>(new Set());
  const auth = useAuth();
  const { theme, toggleTheme } = useThemePreference();

  // Track if instructions have been dismissed (persist to localStorage)
  const [showInstructions, setShowInstructions] = useState(true);

  // Load instructions visibility from localStorage after mount
  useEffect(() => {
    const dismissed = localStorage.getItem("instructions_dismissed") === "true";
    setShowInstructions(!dismissed);
  }, []);

  const handleDismissInstructions = () => {
    setShowInstructions(false);
    localStorage.setItem("instructions_dismissed", "true");
  };

  // Process ball commands from AI agent
  useEffect(() => {
    const commands = agentState.ballCommands;
    if (!commands || commands.length === 0 || !canvasRef.current) return;

    // Create a unique key for this batch of commands
    const batchKey = JSON.stringify(commands);

    // Skip if we've already processed this exact batch
    if (processedCommandsRef.current.has(batchKey)) return;

    // Process commands through the canvas
    canvasRef.current.processCommands(commands);

    // Mark as processed
    processedCommandsRef.current.add(batchKey);

    // Keep set from growing unbounded (only keep last 100)
    if (processedCommandsRef.current.size > 100) {
      const entries = Array.from(processedCommandsRef.current);
      processedCommandsRef.current = new Set(entries.slice(-50));
    }
  }, [agentState.ballCommands]);

  // Determine theme based on document class
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  // Get simulation state from canvas ref
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
            {isPaused && (
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded text-xs">
                Paused
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              aria-label="Toggle theme"
              className="rounded-full h-9 w-9 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Profile - anonymous or authenticated */}
            {auth?.authMethod ? (
              <UserProfile />
            ) : (
              <AnonymousProfile onShowLandingPage={onShowLandingPage} />
            )}
          </div>
        </div>
      </div>

      {/* Ball Canvas */}
      <div className="flex-1 relative">
        <BallCanvas
          ref={canvasRef}
          theme={isDark ? "dark" : "light"}
          className="absolute inset-0"
        />
      </div>

      {/* Instructions at bottom */}
      {showInstructions && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white/95 dark:from-neutral-900/95 to-transparent">
          <div className="flex items-start justify-between gap-2 bg-white/90 dark:bg-neutral-800/90 rounded-lg p-3 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Interactive Ball Simulation
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Click anywhere to add balls. Drag balls to throw them. Gravity changes direction every 5 seconds.
                Sign in to control with AI chat.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismissInstructions}
              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
              aria-label="Dismiss instructions"
            >
              <X size={16} className="text-neutral-400" />
            </button>
          </div>
        </div>
      )}

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
