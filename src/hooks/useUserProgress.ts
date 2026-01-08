import { useCallback, useEffect, useRef, useState } from "react";
import type { AppAgentState } from "../agent/AppAgent";

/**
 * User progress data structure
 */
export interface UserProgress {
  instructionsDismissed: boolean;
  lastUpdated: string;
}

const LOCAL_STORAGE_KEY = "user_progress";

/**
 * Load progress from localStorage (for anonymous users)
 */
function loadLocalProgress(): UserProgress | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UserProgress;
    }
  } catch (error) {
    console.error("[useUserProgress] Error loading from localStorage:", error);
  }
  return null;
}

/**
 * Save progress to localStorage
 */
function saveLocalProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("[useUserProgress] Error saving to localStorage:", error);
  }
}

/**
 * Get agent endpoint URL for updating user progress
 */
function getUpdateUrl(agentConfig: {
  agent: string;
  name: string;
  query?: Record<string, string>;
}): string {
  const urlObj = new URL(
    `/agents/${agentConfig.agent}/${agentConfig.name}/update-user-progress`,
    window.location.origin
  );

  if (agentConfig.query) {
    for (const [k, v] of Object.entries(agentConfig.query)) {
      if (typeof v === "string") urlObj.searchParams.set(k, v);
    }
  }

  return urlObj.toString();
}

/**
 * Options for the useUserProgress hook
 */
interface UseUserProgressOptions {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Current agent state (synced via WebSocket) */
  agentState: AppAgentState | null;
  /** Agent configuration for making update requests */
  agentConfig: {
    agent: string;
    name: string;
    query?: Record<string, string>;
  } | null;
  /** Callback when sync message should be shown */
  onSyncMessage?: (message: string) => void;
}

/**
 * Hook for managing user progress with simple dual-storage:
 * - Anonymous users: localStorage only
 * - Authenticated users: Agent state (via Durable Object persistence)
 *
 * The agent state is the source of truth for authenticated users.
 * localStorage is only used for anonymous users and migration.
 */
export function useUserProgress({
  isAuthenticated,
  agentState,
  agentConfig,
  onSyncMessage
}: UseUserProgressOptions) {
  // Local state for anonymous users - start null for SSR compatibility
  const [localProgress, setLocalProgress] = useState<UserProgress | null>(null);
  const [_hasHydrated, setHasHydrated] = useState(false);

  // Track if we've done migration for this session
  const hasMigratedRef = useRef(false);

  // Load from localStorage after hydration (client-only)
  useEffect(() => {
    setHasHydrated(true);
    const stored = loadLocalProgress();
    if (stored) {
      setLocalProgress(stored);
    }
  }, []);

  // Get progress from the appropriate source
  const serverProgress = agentState?.userProgress ?? null;
  const progress = isAuthenticated ? serverProgress : localProgress;

  /**
   * Update progress - writes to agent state (authenticated) or localStorage (anonymous)
   */
  const updateProgress = useCallback(
    async (updates: Partial<UserProgress>) => {
      const currentProgress = isAuthenticated ? serverProgress : localProgress;
      const newProgress: UserProgress = {
        instructionsDismissed:
          updates.instructionsDismissed ??
          currentProgress?.instructionsDismissed ??
          false,
        lastUpdated: new Date().toISOString()
      };

      if (isAuthenticated && agentConfig) {
        // Update agent state via endpoint (agent will persist via setState)
        try {
          await fetch(getUpdateUrl(agentConfig), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newProgress)
          });
        } catch (error) {
          console.error("[useUserProgress] Error updating agent state:", error);
        }
      } else {
        // Update localStorage for anonymous users
        setLocalProgress(newProgress);
        saveLocalProgress(newProgress);
      }
    },
    [isAuthenticated, agentConfig, serverProgress, localProgress]
  );

  /**
   * Migration: On login, if server is empty but localStorage has data, migrate once
   */
  useEffect(() => {
    if (
      isAuthenticated &&
      agentConfig &&
      !serverProgress &&
      localProgress &&
      !hasMigratedRef.current
    ) {
      hasMigratedRef.current = true;

      // Migrate localStorage to server
      fetch(getUpdateUrl(agentConfig), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localProgress)
      })
        .then(() => {
          onSyncMessage?.("Migrated local progress to your account");
        })
        .catch((error) => {
          console.error("[useUserProgress] Migration failed:", error);
        });
    }
  }, [
    isAuthenticated,
    agentConfig,
    serverProgress,
    localProgress,
    onSyncMessage
  ]);

  // Reset migration flag on logout
  useEffect(() => {
    if (!isAuthenticated) {
      hasMigratedRef.current = false;
    }
  }, [isAuthenticated]);

  /**
   * Convenience method to dismiss instructions
   */
  const dismissInstructions = useCallback(() => {
    updateProgress({ instructionsDismissed: true });
  }, [updateProgress]);

  /**
   * Convenience method to show instructions
   */
  const showInstructions = useCallback(() => {
    updateProgress({ instructionsDismissed: false });
  }, [updateProgress]);

  return {
    /** Current progress state */
    progress,
    /** Update progress with partial updates */
    updateProgress,
    /** Convenience: dismiss instructions */
    dismissInstructions,
    /** Convenience: show instructions */
    showInstructions,
    /** Whether instructions are currently visible (inverse of dismissed) */
    instructionsVisible: !progress?.instructionsDismissed
  };
}
