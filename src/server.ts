import { routeAgentRequest } from "agents";
import { AppAgent } from "./agent";
import { handleTokenExchange } from "./api/oauth-token-exchange";
import { getOAuthConfig } from "./config/oauth";

export { AppAgent };

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

    if (url.pathname === "/check-open-ai-key") {
      const hasApiKey = !!env.GATEWAY_API_KEY;
      return Response.json({
        success: hasApiKey,
      });
    }

    if (!env.GATEWAY_API_KEY) {
      console.error(
        "GATEWAY_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
      return new Response("GATEWAY_API_KEY is not set", { status: 500 });
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

    try {
      // Try to route to agent first
      const agentResponse = await routeAgentRequest(request, env, { cors: true });
      if (agentResponse) {
        return agentResponse;
      }

      // For the root route and other non-API routes, serve a simple HTML page
      if (url.pathname === "/" || (!url.pathname.includes("/api/") && !url.pathname.includes("."))) {
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

/**
 * Handle OAuth callback directly on the server
 */
async function handleOAuthCallback(request: Request, env: Env): Promise<Response> {
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

    const config = getOAuthConfig(env);
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
      return new Response(
        getCallbackHTML("Authentication failed: Token exchange error", null),
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    const tokenData = await response.json() as {
      access_token: string;
      user_info: {
        id: string;
        email: string;
        credits: number;
      };
    };

    console.log(
      "[OAuth Callback] Token exchange successful for user:",
      tokenData.user_info?.id
    );

    // Return HTML that stores auth data and redirects to main app
    return new Response(
      getCallbackHTML(null, {
        type: "atyourservice",
        apiKey: tokenData.access_token,
        userInfo: tokenData.user_info,
      }),
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("[OAuth Callback] Error:", error);
    return new Response(
      getCallbackHTML("Authentication failed: Internal error", null),
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}

/**
 * Generate HTML for OAuth callback handling
 */
function getCallbackHTML(error: string | null, authData: any): string {
  if (error) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Error</title>
    <meta charset="utf-8">
    <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; background: #1e293b; color: white; }
        .error { background: #dc2626; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; }
        .button { background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; text-decoration: none; display: inline-block; margin-top: 1rem; }
    </style>
</head>
<body>
    <h1>🤖 App Agent Template</h1>
    <div class="error">${error}</div>
    <a href="/" class="button">Try Again</a>
</body>
</html>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Complete</title>
    <meta charset="utf-8">
    <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; background: #1e293b; color: white; }
        .success { background: #059669; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; }
    </style>
</head>
<body>
    <h1>🤖 App Agent Template</h1>
    <div class="success">Authentication successful! Redirecting...</div>
    <script>
        // Store auth data and redirect
        localStorage.setItem('auth_method', JSON.stringify(${JSON.stringify(authData)}));
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
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
