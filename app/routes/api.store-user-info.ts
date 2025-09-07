import type { ActionFunctionArgs } from "@remix-run/cloudflare";

/**
 * API endpoint to store user info in UserDO after OAuth callback
 * This allows the AuthCallback component to store JWT tokens without
 * needing to know about project-specific routing
 */
export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { user_id, api_key, email, credits, payment_method } = body;

    if (!user_id || !api_key || !email) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Get UserDO instance and store the user info + JWT token
    const env = context.cloudflare.env as Env;
    const userDOId = env.UserDO.idFromName(user_id);
    const userDO = env.UserDO.get(userDOId);

    const response = await userDO.fetch(
      new Request("https://user-do/store-user-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          api_key,
          email,
          credits: credits || 0,
          payment_method: payment_method || "credits"
        })
      })
    );

    if (response.ok) {
      return new Response("OK");
    } else {
      const errorText = await response.text();
      console.error("UserDO store-user-info failed:", errorText);
      return new Response("Failed to store user info", { status: 500 });
    }
  } catch (error) {
    console.error("Error storing user info:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
