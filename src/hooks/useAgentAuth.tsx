import { useMemo } from "react";
import { useAuth } from "../components/auth/AuthProvider";

export function useAgentAuth() {
  const { authMethod } = useAuth();

  const agentConfig = useMemo(() => {
    if (authMethod?.userInfo && authMethod.apiKey) {
      // Authenticated user gets their own agent instance
      // This matches the ATYSOAUTH.md plan: /agents/app-agent/{user_id}
      const userId = authMethod.userInfo.id;

      return {
        agent: "app-agent",
        name: userId, // User-specific room name
        query: {
          token: authMethod.apiKey, // Ensure token is always a string
        },
      } as const;
    }
    // SECURITY: No fallback for unauthenticated users - return null
    // This ensures the app shows login screen instead of trying to connect
    return null;
  }, [authMethod]);

  return agentConfig;
}
