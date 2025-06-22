interface OAuthConfig {
  client_id: string;
  client_secret: string;
  auth_url: string;
  token_url: string;
  verify_url: string;
}

function getEnvironmentConfig(env: Env): OAuthConfig {
  // Check if we're in development
  const isDev = env.SETTINGS_ENVIRONMENT === "dev";

  if (isDev) {
    return {
      client_id: "app-agent-template",
      client_secret: env.APP_AGENT_TEMPLATE_SECRET, // Now properly typed
      auth_url: "http://localhost:5173/oauth/authorize",
      token_url: "http://localhost:5173/oauth/token",
      verify_url: "http://localhost:5173/oauth/verify",
    };
  }

  // Production/staging - connect to live AtYourService.ai
  return {
    client_id: "app-agent-template",
    client_secret: env.APP_AGENT_TEMPLATE_SECRET, // Now properly typed
    auth_url: "https://atyourservice.ai/oauth/authorize",
    token_url: "https://atyourservice.ai/oauth/token",
    verify_url: "https://atyourservice.ai/oauth/verify",
  };
}

export const getOAuthConfig = (env: Env): OAuthConfig => {
  return getEnvironmentConfig(env);
};

export type { OAuthConfig };
