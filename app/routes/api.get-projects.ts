import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { validateAuthHeader } from "../lib/jwt-auth";

/**
 * API endpoint to get project list from UserDO
 * This provides a user-specific route for retrieving project metadata
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  try {
    // Validate JWT token from Authorization header
    const authValidation = validateAuthHeader(request);
    if (!authValidation.isValid) {
      return new Response(JSON.stringify({ error: authValidation.error }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "user_id parameter required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify that the JWT userId matches the requested user_id
    if (authValidation.payload!.userId !== userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: Cannot access projects for different user"
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Get UserDO instance and retrieve project list
    const env = context.cloudflare.env as Env;
    const userDOId = env.UserDO.idFromName(userId);
    const userDO = env.UserDO.get(userDOId);

    const response = await userDO.fetch(
      new Request("https://user-do/list-projects", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      })
    );

    if (response.ok) {
      const projects = await response.json();
      return new Response(JSON.stringify(projects), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const errorText = await response.text();
      console.error("UserDO list-projects failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get projects", projects: [] }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error getting projects:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", projects: [] }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
