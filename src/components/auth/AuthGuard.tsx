import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard - Always renders children, shows auth errors as toast
 * The landing page and unauthenticated UI is handled by AppContent
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading } = useAuth();
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

  // Always render children - anonymous profile dropdown handles sign-in prompt
  // Show auth error notification if present
  return (
    <>
      {authError && (
        <div className="fixed bottom-4 left-4 z-[60]">
          <div className="bg-red-50 dark:bg-red-900/50 backdrop-blur-sm rounded-lg shadow-xl border border-red-200 dark:border-red-700 p-4 max-w-sm">
            <p className="text-red-600 dark:text-red-400 text-sm">{authError}</p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
