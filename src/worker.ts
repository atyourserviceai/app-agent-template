import { createRequestHandler } from "react-router";
import { routeAgentRequest } from "agents";
import { AppAgent } from "./agent";

export { AppAgent };

interface Env {
  ASSETS: Fetcher;
  AppAgent: DurableObjectNamespace;
  GATEWAY_BASE_URL: string;
  OAUTH_PROVIDER_BASE_URL: string;
  ATYOURSERVICE_OAUTH_CLIENT_ID?: string;
  SETTINGS_ENVIRONMENT?: string; // "dev" | "staging" | "production"
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  (import.meta as any).env?.MODE || "production"
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/auth/callback") {
      return handleOAuthCallback(request, env);
    }

    if (url.pathname === "/api/oauth/config") {
      return new Response(
        JSON.stringify({
          client_id: env.ATYOURSERVICE_OAUTH_CLIENT_ID,
          auth_url: `${env.OAUTH_PROVIDER_BASE_URL}/oauth/authorize`,
          token_url: `${env.OAUTH_PROVIDER_BASE_URL}/oauth/token`,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.pathname === "/api/user/info") {
      const auth = request.headers.get("Authorization");
      if (!auth) {
        return new Response(
          JSON.stringify({ error: "Missing Authorization header" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      const resp = await fetch(`${env.GATEWAY_BASE_URL}/v1/user/info`, {
        method: "GET",
        headers: { Authorization: auth },
      });
      return new Response(await resp.text(), {
        status: resp.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const agentResp = await routeAgentRequest(request, env, { cors: true });
    if (agentResp) return agentResp;

    return requestHandler(request, { cloudflare: { env, ctx } });
  },
} satisfies ExportedHandler<Env>;

async function handleOAuthCallback(
  _request: Request,
  _env: Env
): Promise<Response> {
  return new Response("Not Implemented", { status: 501 });
}
