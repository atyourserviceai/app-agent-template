import { useRef, useEffect, useCallback, useState } from "react";
import { BallCanvas, type BallCanvasHandle } from "../../balls";
import type { AgentMode, AppAgentState } from "../../agent/AppAgent";
import { Moon, Sun } from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthProvider";
import { UserProfile } from "../auth/UserProfile";
import { AnonymousProfile } from "../auth/AnonymousProfile";
import { useThemePreference } from "../../hooks/useThemePreference";
import { useUserProgress } from "../../hooks/useUserProgress";

type CanvasTheme = "dark" | "light";

interface PresentationPanelProps {
  agentState: AppAgentState;
  agentMode: AgentMode;
  showDebug: boolean;
  onShowLandingPage?: () => void;
  /** Agent config for making API calls (for authenticated users) */
  agentConfig?: { agent: string; name: string; query?: Record<string, string> } | null;
}

export function PresentationPanel({
  agentState,
  showDebug,
  onShowLandingPage,
  agentConfig
}: PresentationPanelProps) {
  const canvasRef = useRef<BallCanvasHandle>(null);
  const processedCommandsRef = useRef<Set<string>>(new Set());
  const auth = useAuth();
  const { theme, toggleTheme } = useThemePreference();

  // Use the dual-storage hook for instructions state
  // - Anonymous users: localStorage
  // - Authenticated users: agentState (source of truth, synced via WebSocket)
  const isAuthenticated = !!auth?.authMethod;
  const {
    instructionsVisible,
    dismissInstructions
  } = useUserProgress({
    isAuthenticated,
    agentState,
    agentConfig: agentConfig ?? null,
    onSyncMessage: (message) => {
      // TODO: Show toast notification (Phase 5)
      console.log("[PresentationPanel] Sync message:", message);
    }
  });

  // Signal when instructions overlay is visible (for AI Chat button positioning)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("simulation-instructions", {
      detail: { isVisible: instructionsVisible }
    }));
  }, [instructionsVisible]);

  // Dismiss instructions on user interaction
  const handleUserInteraction = useCallback(() => {
    if (instructionsVisible) {
      dismissInstructions();
    }
  }, [instructionsVisible, dismissInstructions]);

  // Canvas theme state - default to "dark" to match server render, then update after mount
  // This avoids hydration mismatch errors
  const [canvasTheme, setCanvasTheme] = useState<CanvasTheme>("dark");

  // Detect and watch for theme changes (dark/light class on html element)
  useEffect(() => {
    const html = document.documentElement;

    const updateTheme = () => {
      setCanvasTheme(html.classList.contains("dark") ? "dark" : "light");
    };

    // Set initial theme after mount
    updateTheme();

    // Watch for class changes on html element
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          updateTheme();
        }
      }
    });

    observer.observe(html, { attributes: true });

    return () => observer.disconnect();
  }, []);

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

  // Get simulation state from canvas ref
  const isPaused = canvasRef.current?.getState().paused ?? false;

  return (
    <div className="h-full bg-white dark:bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <button
              type="button"
              onClick={onShowLandingPage}
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              App Agent Template
            </button>
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
          theme={canvasTheme}
          className="absolute inset-0"
          onUserInteraction={handleUserInteraction}
        />
      </div>

      {/* Instructions overlay (only when not dismissed) */}
      {instructionsVisible && (
        <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
          <div className="inline-block bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Click to add balls. Drag to throw. Gravity shifts every 5 seconds.
            </p>
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
