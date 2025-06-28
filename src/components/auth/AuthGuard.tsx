import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { authMethod, login, isLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for auth errors in URL and localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error) {
      switch (error) {
        case "invalid_state":
          setAuthError("Authentication failed: Invalid state parameter");
          break;
        case "token_exchange_failed":
          setAuthError("Authentication failed: Could not exchange token");
          break;
        default:
          setAuthError(`Authentication failed: ${error}`);
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check for invalid token flag
    const invalidToken = localStorage.getItem("auth_invalid_token");
    if (invalidToken) {
      setAuthError(
        "You were automatically signed out due to an invalid token. Please sign in again."
      );
      localStorage.removeItem("auth_invalid_token");
    }

    // Check for expired token flag
    const expiredToken = localStorage.getItem("auth_expired_token");
    if (expiredToken) {
      setAuthError(
        "Your session has expired. Please sign in again to continue using the application."
      );
      localStorage.removeItem("auth_expired_token");
    }
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authMethod) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              App Agent Template{" "}
            </h1>
            <p className="text-blue-400 text-lg mb-1">
              ✨ AI Agent Boilerplate ✨
            </p>
            <p className="text-gray-300 text-sm">
              Uses{" "}
              <a
                href="https://atyourservice.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                AI @ Your Service
              </a>{" "}
              as billing solution for AI usage
            </p>
          </div>

          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Get Started with AI
              </h2>
              <p className="text-gray-300 text-sm">
                Sign in with AI @ Your Service to power your agent
              </p>
            </div>

            <div className="mb-6 space-y-3 text-sm text-gray-300">
              <div className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Get 50¢ in free credits to start
              </div>
              <div className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Track usage in your dashboard
              </div>
              <div className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Top up or use your own OpenAI API key
              </div>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{authError}</p>
              </div>
            )}

            <button
              type="button"
              onClick={login}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 hover:cursor-pointer"
            >
              <span>🎯</span>
              <span>Sign in with AI @ Your Service</span>
            </button>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-xs">
                We'll only access your account to provide AI services and track
                usage. Your data is secure and never shared.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
