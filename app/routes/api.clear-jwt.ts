import type { ActionFunctionArgs } from "react-router";
import { validateAuthHeader } from "../lib/jwt-auth";

/**
 * API endpoint to clear JWT token from UserDO on logout
 * This provides a project-agnostic way to clear JWT tokens for security
 */
export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Validate JWT token from Authorization header
    const authValidation = validateAuthHeader(request);
    if (!authValidation.isValid) {
      return new Response(JSON.stringify({ error: authValidation.error }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = (await request.json()) as { user_id?: string };
    const { user_id } = body;

    if (!user_id) {
      return new Response("Missing user_id", { status: 400 });
    }

    // Verify that the JWT userId matches the requested user_id
    if (authValidation.payload!.userId !== user_id) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: Cannot clear JWT for different user"
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Get UserDO instance and clear the JWT token
    const env = context.cloudflare.env as Env;
    const userDOId = env.UserDO.idFromName(user_id);
    const userDO = env.UserDO.get(userDOId);

    const response = await userDO.fetch(
      new Request("https://user-do/clear-jwt", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      })
    );

    if (response.ok) {
      return new Response("OK");
    } else {
      const errorText = await response.text();
      console.error("UserDO clear-jwt failed:", errorText);
      return new Response("Failed to clear JWT token", { status: 500 });
    }
  } catch (error) {
    console.error("Error clearing JWT token:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
