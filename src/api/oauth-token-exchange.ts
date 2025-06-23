interface TokenExchangeRequest {
  code: string;
  grant_type: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  user_info: {
    id: string;
    email: string;
    credits: number;
    granted_promo?: number;
    payment_method: string;
  };
}

function getServerOAuthConfig(env: Env) {
  return {
    client_id: "app-agent-template",
    token_url: `${env.OAUTH_PROVIDER_BASE_URL}/oauth/token`,
    client_secret: env.OAUTH_CLIENT_SECRET, // OAuth client secret from environment
  };
}

export async function handleTokenExchange(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { code, grant_type }: TokenExchangeRequest = await request.json();

    if (!code || grant_type !== "authorization_code") {
      return new Response("Invalid request parameters", { status: 400 });
    }

    const config = getServerOAuthConfig(env);

    console.log(
      "[OAuth Token Exchange] Exchanging authorization code for token..."
    );

    // Make the secure token exchange with the client secret
    const response = await fetch(config.token_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: config.client_id,
        client_secret: config.client_secret,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Token exchange failed: ${response.status} - ${errorText}`);
      return new Response(`Token exchange failed: ${response.status}`, {
        status: response.status,
      });
    }

    const tokenData = (await response.json()) as TokenResponse;

    console.log(
      "[OAuth Token Exchange] Token exchange successful for user:",
      tokenData.user_info?.id
    );

    // Return the token data to the client (without exposing the client secret)
    return new Response(JSON.stringify(tokenData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[OAuth Token Exchange] Error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
