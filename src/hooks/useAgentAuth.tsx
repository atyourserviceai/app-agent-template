import { useMemo } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { useProject } from "../contexts/ProjectContext";

/**
 * Hook for project-based agent authentication
 * @param projectName - Name of the project (e.g., "personal", "saas-ideas")
 * @returns Agent configuration for connecting to project-specific AppAgent instance
 */
export function useProjectAuth(projectName: string = "personal") {
  const { authMethod } = useAuth();

  const agentConfig = useMemo(() => {
    if (authMethod?.userInfo && authMethod.apiKey) {
      // Authenticated user gets their own project-specific agent instance
      // Agent name format: {userId}-{projectName} for true project isolation
      const userId = authMethod.userInfo.id;
      const agentName = `${userId}-${projectName}`;

      return {
        agent: "app-agent",
        name: agentName, // Project-specific room/agent name for isolation
        query: {
          token: authMethod.apiKey, // JWT token for authentication
        },
      } as const;
    }
    // SECURITY: No fallback for unauthenticated users - return null
    // This ensures the app shows login screen instead of trying to connect
    return null;
  }, [authMethod, projectName]);

  return agentConfig;
}

/**
 * Hook that uses the currently selected project from ProjectContext
 * @returns Agent configuration for the currently selected project
 */
export function useCurrentProjectAuth() {
  const { currentProject } = useProject();
  return useProjectAuth(currentProject?.name || "personal");
}
