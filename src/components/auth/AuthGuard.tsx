import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { LandingPage } from "../LandingPage";

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

  // Show loading spinner while checking authentication. Render the same on SSR and CSR
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
    // Floating login widget overlay; slightly blurred backdrop and scrollable if needed
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto p-4 md:p-6 bg-transparent supports-[backdrop-filter]:backdrop-blur-[2px]">
        <div className="w-full max-w-2xl mx-auto my-8 md:my-12">
          <LandingPage onSignIn={login} authError={authError} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
