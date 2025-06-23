import { useMemo } from "react";
import { useAuth } from "../components/auth/AuthProvider";

export function useAgentAuth() {
  const { authMethod } = useAuth();

  const agentConfig = useMemo(() => {
    if (!authMethod || !authMethod.userInfo || !authMethod.apiKey) return null;

    // Each user gets their own agent instance using their user ID
    // This matches the ATYSOAUTH.md plan: /agents/app-agent-template/{user_id}
    const userId = authMethod.userInfo.id;

    return {
      agent: "app-agent",
      name: userId, // User-specific room name
      query: {
        token: authMethod.apiKey, // Ensure token is always a string
      },
    } as const;
  }, [authMethod]);

  return agentConfig;
}
