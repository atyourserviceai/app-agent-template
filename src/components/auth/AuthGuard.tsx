import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard - Only renders children when authenticated
 * The landing page and unauthenticated UI is handled by AppContent
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { authMethod, isLoading } = useAuth();

  // Show nothing while checking authentication
  if (isLoading) {
    return null;
  }

  // Only render children when authenticated
  if (!authMethod) {
    return null;
  }

  return <>{children}</>;
}
