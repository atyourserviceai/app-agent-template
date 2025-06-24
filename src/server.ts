import { routeAgentRequest } from "agents";
import { AppAgent } from "./agent";
import { handleTokenExchange } from "./api/oauth-token-exchange";

export { AppAgent };

interface UserInfo {
  id: string;
  email: string;
  credits: number;
  payment_method: string;
}

interface TokenData {
  access_token: string;
  user_info: UserInfo;
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle OAuth callback directly on the server
    if (url.pathname === "/auth/callback") {
      return handleOAuthCallback(request, env);
    }

    // Handle OAuth token exchange
    if (url.pathname === "/api/oauth/token-exchange") {
      return handleTokenExchange(request, env);
    }

    // Check if this is a request for an unknown agent namespace before routing
    if (url.pathname.includes("/agents/")) {
      const pathParts = url.pathname.split("/");
      const agentName = pathParts[2]; // /agents/{agentName}/...

      if (agentName && agentName !== "app-agent") {
        return new Response(
          JSON.stringify({
            error: "Agent not found",
            message: `Agent '${agentName}' does not exist. Available agent: 'app-agent'`,
            availableAgents: ["app-agent"],
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          }
        );
      }
    }

    // Handle OAuth configuration requests
    if (url.pathname === "/api/oauth/config") {
      return new Response(
        JSON.stringify({
          client_id: "app-agent-template",
          auth_url: `${env.OAUTH_PROVIDER_BASE_URL}/oauth/authorize`,
          token_url: `${env.OAUTH_PROVIDER_BASE_URL}/oauth/token`,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle user info requests by proxying to gateway
    if (url.pathname === "/api/user/info") {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing Authorization header" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Proxy the request to the gateway
      const gatewayResponse = await fetch(
        `${env.GATEWAY_BASE_URL}/v1/user/info`,
        {
          method: "GET",
          headers: {
            Authorization: authHeader,
          },
        }
      );

      // Return the gateway response
      const responseData = await gatewayResponse.text();
      return new Response(responseData, {
        status: gatewayResponse.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      // Try to route to agent first
      const agentResponse = await routeAgentRequest(request, env, {
        cors: true,
        onBeforeConnect: async (request) => {
          const url = new URL(request.url);
          const token = url.searchParams.get("token");

          if (!token) {
            return new Response("Authentication required", { status: 401 });
          }

          // If token provided, verify it
          const userInfo = await verifyOAuthToken(token, env);
          if (!userInfo) {
            return new Response("Invalid auth token", { status: 403 });
          }

          // Ensure user can only access their own agent instance
          const pathMatch = url.pathname.match(
            /\/agents\/([^\/]+)\/([^\/\?]+)/
          );
          if (pathMatch) {
            const [, , roomName] = pathMatch;
            if (roomName !== userInfo.id) {
              return new Response("Access denied: User ID mismatch", {
                status: 403,
              });
            }
          }

          // Store user info in agent state (includes OAuth token as API key)
          // User info will be loaded by the agent when it initializes using the OAuth token
          console.log(
            `[Auth] Authentication successful for user: ${userInfo.id}`
          );

          return undefined; // Continue to agent
        },
        onBeforeRequest: async (request) => {
          const url = new URL(request.url);

          // Skip auth for API routes and static assets
          if (
            url.pathname.startsWith("/api/") ||
            url.pathname.startsWith("/assets/") ||
            url.pathname === "/"
          ) {
            return undefined;
          }

          const token =
            url.searchParams.get("token") ||
            request.headers.get("Authorization")?.replace("Bearer ", "");

          // Require auth for all agent requests
          const pathMatch = url.pathname.match(
            /\/agents\/([^\/]+)\/([^\/\?]+)/
          );
          if (pathMatch) {
            if (!token) {
              return new Response("Authentication required", { status: 401 });
            }

            const userInfo = await verifyOAuthToken(token, env);
            if (!userInfo) {
              return new Response("Invalid auth token", { status: 403 });
            }

            const [, , roomName] = pathMatch;
            if (userInfo.id !== roomName) {
              return new Response("Access denied", { status: 403 });
            }
          }

          return undefined; // Continue to agent
        },
      });

      if (agentResponse) {
        return agentResponse;
      }

      // For the root route and other non-API routes, serve a simple HTML page
      if (
        url.pathname === "/" ||
        (!url.pathname.includes("/api/") && !url.pathname.includes("."))
      ) {
        return new Response(getMainHTML(), {
          headers: {
            "Content-Type": "text/html",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // For other requests, return 404
      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("Error routing request:", error);

      // For other errors, return a generic error response
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: "An unexpected error occurred while processing the request",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
} satisfies ExportedHandler<Env>;

async function verifyOAuthToken(
  token: string,
  env: Env
): Promise<UserInfo | null> {
  try {
    // Use the OAuth provider URL (website) for token verification
    const oauthProviderUrl =
      env.OAUTH_PROVIDER_BASE_URL || "https://atyourservice.ai";
    const verifyEndpoint = `${oauthProviderUrl}/oauth/verify`;

    console.log(`[Auth] Verifying token at: ${verifyEndpoint}`);

    const response = await fetch(verifyEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`[Auth] Verification response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Auth] Verification failed: ${response.status} - ${errorText}`
      );
      return null;
    }

    const userInfo = (await response.json()) as UserInfo;
    console.log(`[Auth] Verification successful for user: ${userInfo.id}`);
    return userInfo;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Handle OAuth callback directly on the server
 */
async function handleOAuthCallback(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("OAuth error:", error);
    return new Response(
      getCallbackHTML(`Authentication failed: ${error}`, null),
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  if (!code || !state) {
    console.error("Missing OAuth parameters");
    return new Response(
      getCallbackHTML("Authentication failed: Missing parameters", null),
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  try {
    console.log("[OAuth Callback] Exchanging authorization code for token...");

    // Exchange code for token using our API endpoint
    const tokenResponse = await fetch(
      `${url.origin}/api/oauth/token-exchange`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = (await tokenResponse.json()) as TokenData;

    console.log(
      `[OAuth Callback] Token exchange successful for user: ${tokenData.user_info.id}`
    );

    // Store user info persistently in the agent's database
    try {
      const agentBaseUrl = `${url.origin}/agents/app-agent/${tokenData.user_info.id}`;
      console.log(
        `[OAuth Callback] Storing user info in agent database for user: ${tokenData.user_info.id}`
      );

      const storeResponse = await fetch(`${agentBaseUrl}/store-user-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: tokenData.user_info.id,
          api_key: tokenData.access_token, // OAuth token IS the gateway API key
          email: tokenData.user_info.email,
          credits: tokenData.user_info.credits,
          payment_method: tokenData.user_info.payment_method,
        }),
      });

      if (storeResponse.ok) {
        console.log(
          `[OAuth Callback] Successfully stored user info for user: ${tokenData.user_info.id}`
        );
      } else {
        console.warn(
          `[OAuth Callback] Failed to store user info: ${storeResponse.status}`
        );
        // Don't fail the OAuth flow if storage fails - user can still authenticate
      }
    } catch (error) {
      console.warn("[OAuth Callback] Error storing user info:", error);
      // Don't fail the OAuth flow if storage fails
    }

    return new Response(getCallbackHTML(null, tokenData), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    console.error("Token exchange failed:", err);
    return new Response(
      getCallbackHTML("Authentication failed: Could not exchange token", null),
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}

/**
 * Generate HTML for OAuth callback handling
 */
function getCallbackHTML(
  error: string | null,
  tokenData: TokenData | null
): string {
  if (error) {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Authentication Failed</title>
  <style>
    body { font-family: system-ui; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    .error { color: #e53e3e; margin-bottom: 1rem; }
    button { background: #3182ce; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Authentication Failed</h2>
    <p class="error">${error}</p>
    <button onclick="window.location.href = '/'">Try Again</button>
  </div>
</body>
</html>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Authentication Successful</title>
  <style>
    body { font-family: system-ui; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    .success { color: #38a169; margin-bottom: 1rem; }
    .spinner { border: 2px solid #f3f3f3; border-top: 2px solid #3182ce; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Authentication Successful!</h2>
    <p class="success">Redirecting to your agent...</p>
  </div>
  <script>
    // Store auth data and redirect
    localStorage.setItem('auth_method', JSON.stringify({
      type: 'atyourservice',
      apiKey: ${JSON.stringify(tokenData?.access_token)},
      userInfo: ${JSON.stringify(tokenData?.user_info)}
    }));

    // Redirect to main app
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  </script>
</body>
</html>`;
}

/**
 * Generate main HTML page
 */
function getMainHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App Agent Template</title>
    <script type="module" crossorigin src="/src/client.tsx"></script>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
}
