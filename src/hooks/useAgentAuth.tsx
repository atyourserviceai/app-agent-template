import { useMemo } from "react";
import { useAuth } from "../components/auth/AuthProvider";

export function useAgentAuth() {
  const { authMethod } = useAuth();

  const agentConfig = useMemo(() => {
    if (authMethod && authMethod.userInfo && authMethod.apiKey) {
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
    } else {
      // Unauthenticated users get demo/default agent
      return {
        agent: "app-agent",
        name: "default-room", // Default demo room
        // No query params needed for demo mode
      } as const;
    }
  }, [authMethod]);

  return agentConfig;
}
