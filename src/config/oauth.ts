export interface OAuthConfig {
  client_id: string;
  auth_url: string;
  token_url: string;
}

export function getOAuthConfig(): OAuthConfig {
  // Use the environment variable set via .env files or deployment environment
  const oauthProviderUrl = import.meta.env.VITE_OAUTH_PROVIDER_BASE_URL;

  console.log('[OAuth Config] VITE_OAUTH_PROVIDER_BASE_URL:', oauthProviderUrl);

  if (!oauthProviderUrl) {
    throw new Error('VITE_OAUTH_PROVIDER_BASE_URL environment variable is not set');
  }

  return {
    client_id: "app-agent-template",
    auth_url: `${oauthProviderUrl}/oauth/authorize`,
    token_url: `${oauthProviderUrl}/oauth/token`,
  };
}
