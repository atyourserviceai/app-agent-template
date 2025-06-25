import { useEffect } from "react";
import { getOAuthConfig } from "../../config/oauth";

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

export default function AuthCallback() {
  useEffect(() => {
    async function handleCallback() {
      // Parse URL search params manually
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");

      if (error) {
        console.error("OAuth error:", error);
        window.location.href = `/?error=${error}`;
        return;
      }

      // Verify state parameter to prevent CSRF attacks
      const storedState = localStorage.getItem("oauth_state");
      if (!code || !state || state !== storedState) {
        console.error("OAuth state mismatch or missing code");
        window.location.href = "/?error=invalid_state";
        return;
      }

      try {
        console.log(
          "[OAuth Callback] Exchanging authorization code for token..."
        );

        const config = await getOAuthConfig();
        const response = await fetch(config.token_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            client_id: config.client_id,
            grant_type: "authorization_code",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Token exchange failed: ${response.status} - ${errorText}`
          );
          throw new Error(`Token exchange failed: ${response.status}`);
        }

        const tokenData = (await response.json()) as TokenResponse;

        console.log("[OAuth Callback] Token exchange successful, user info:", {
          userId: tokenData.user_info?.id,
          email: tokenData.user_info?.email,
          credits: tokenData.user_info?.credits,
        });

        // Store the AtYourService.ai API key and user info
        const authMethod = {
          type: "atyourservice" as const,
          apiKey: tokenData.access_token,
          userInfo: {
            id: tokenData.user_info.id,
            email: tokenData.user_info.email,
            credits: tokenData.user_info.credits,
          },
        };

        localStorage.setItem("auth_method", JSON.stringify(authMethod));

        // Clean up OAuth state
        localStorage.removeItem("oauth_state");

        // Notify the agent about the new user info
        try {
          console.log("[OAuth Callback] Notifying agent of new user info...");
          const agentResponse = await fetch(
            `/agents/app-agent/${tokenData.user_info.id}/store-user-info`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenData.access_token}`,
              },
              body: JSON.stringify({
                user_id: tokenData.user_info.id,
                api_key: tokenData.access_token,
                email: tokenData.user_info.email,
                credits: tokenData.user_info.credits,
                payment_method: tokenData.user_info.payment_method,
              }),
            }
          );

          if (agentResponse.ok) {
            console.log(
              "[OAuth Callback] Successfully notified agent of new user info"
            );
          } else {
            console.warn(
              "[OAuth Callback] Failed to notify agent of new user info:",
              agentResponse.status
            );
          }
        } catch (error) {
          console.warn("[OAuth Callback] Error notifying agent:", error);
        }

        console.log(
          "[OAuth Callback] Authentication successful, redirecting to app..."
        );
        window.location.href = "/";
      } catch (err) {
        console.error("Token exchange failed:", err);
        window.location.href = "/?error=token_exchange_failed";
      }
    }

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing Authentication
        </h2>
        <p className="text-gray-600">
          Please wait while we set up your account...
        </p>
      </div>
    </div>
  );
}
