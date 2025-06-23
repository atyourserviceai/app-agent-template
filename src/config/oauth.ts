export interface OAuthConfig {
  client_id: string;
  auth_url: string;
  token_url: string;
}

let cachedConfig: OAuthConfig | null = null;

export async function getOAuthConfig(): Promise<OAuthConfig> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/api/oauth/config');
    if (!response.ok) {
      throw new Error(`Failed to fetch OAuth config: ${response.status}`);
    }

    const config: OAuthConfig = await response.json();
    cachedConfig = config;
    console.log('[OAuth Config] Fetched from server:', config);
    return config;
  } catch (error) {
    console.error('[OAuth Config] Failed to fetch from server:', error);
    throw new Error('Failed to load OAuth configuration');
  }
}
