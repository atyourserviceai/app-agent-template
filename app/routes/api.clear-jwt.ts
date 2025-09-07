import type { ActionFunctionArgs } from "@remix-run/cloudflare";

/**
 * API endpoint to clear JWT token from UserDO on logout
 * This provides a project-agnostic way to clear JWT tokens for security
 */
export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return new Response("Missing user_id", { status: 400 });
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