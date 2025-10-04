import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { getOAuthConfig, type OAuthConfig } from "../../config/oauth";

// JWT Token utility functions
function isJWTToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3;
}

function isJWTTokenExpired(token: string): boolean {
  if (!token || !isJWTToken(token)) return true;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    // Use atob for client-side base64 decoding
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;

    if (!exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= exp;
  } catch (error) {
    console.error("Error checking JWT token expiration:", error);
    return true;
  }
}

export interface UserInfo {
  id: string;
  email: string;
  credits: number;
  starting_balance?: number;
  used_credits?: number;
}

export interface AuthMethod {
  type: "atyourservice" | "byok";
  apiKey?: string; // AtYourService.ai API key from OAuth
  userInfo?: UserInfo;
  byokKeys?: {
    openai?: string;
    anthropic?: string;
  };
}

export interface AuthContextType {
  authMethod: AuthMethod | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  oauthConfig: OAuthConfig | null;
  login: () => void;
  logout: () => void;
  switchToBYOK: (keys: { openai?: string; anthropic?: string }) => void;
  switchToCredits: () => void;
  refreshUserInfo: () => Promise<void>;
  checkTokenExpiration: () => boolean; // Returns true if token is expired
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  // Start with loading false for SSR/bots, will be set to true on client mount
  // This prevents bots from seeing loading spinners while still preventing auth flash on client
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null);

  // Note: Agent sync moved to project-specific components to avoid
  // auth components needing to know about project structure

  // Client-side hydration effect - prevents auth flash only on client
  useEffect(() => {
    // This only runs on the client after hydration
    setHasHydrated(true);
    setIsLoading(true);
  }, []);

  useEffect(() => {
    // Don't run auth check until after hydration
    if (!hasHydrated) return;

    // Load OAuth config and check for stored auth on component mount
    const init = async () => {
      try {
        const config = await getOAuthConfig();
        setOauthConfig(config);
      } catch (error) {
        console.error("Failed to load OAuth config:", error);
      }

      const stored = localStorage.getItem("auth_method");
      if (stored) {
        try {
          const parsedAuth = JSON.parse(stored);

          // Check for expired JWT tokens first
          if (
            parsedAuth?.apiKey &&
            isJWTToken(parsedAuth.apiKey) &&
            isJWTTokenExpired(parsedAuth.apiKey)
          ) {
            console.log("Stored JWT token is expired, clearing auth");
            localStorage.removeItem("auth_method");
            localStorage.setItem("auth_expired_token", "true");
            setIsLoading(false);
            return;
          }

          // For old format tokens, check if they're expired too
          if (
            parsedAuth?.apiKey &&
            isJWTToken(parsedAuth.apiKey) &&
            isJWTTokenExpired(parsedAuth.apiKey)
          ) {
            console.log("Stored JWT token is expired, clearing auth");
            localStorage.removeItem("auth_method");
            localStorage.setItem("auth_expired_token", "true");
            setIsLoading(false);
            return;
          }

          // Validate the token if it exists
          if (parsedAuth?.apiKey) {
            try {
              const response = await fetch("/api/user/info", {
                headers: {
                  Authorization: `Bearer ${parsedAuth.apiKey}`
                },
                method: "GET"
              });

              if (response.ok) {
                // Token is valid, use the stored auth
                setAuthMethod(parsedAuth);
              } else {
                // Token is invalid, clear it and show sign-in with message
                console.log("Stored token is invalid, clearing auth");
                localStorage.removeItem("auth_method");
                localStorage.setItem("auth_invalid_token", "true");
              }
            } catch (_error) {
              // Network error, assume stored auth is potentially valid
              console.log(
                "Could not validate token due to network error, keeping stored auth"
              );
              setAuthMethod(parsedAuth);
            }
          } else {
            // No API key, invalid auth
            localStorage.removeItem("auth_method");
          }
        } catch (e) {
          console.error("Invalid stored auth:", e);
          localStorage.removeItem("auth_method");
        }
      }
      setIsLoading(false);
    };

    init();
  }, [hasHydrated]);

  const login = async () => {
    try {
      const config = oauthConfig || (await getOAuthConfig());
      const state = Math.random().toString(36).substring(2);

      const authUrl = new URL(config.auth_url);
      authUrl.searchParams.set("client_id", config.client_id);
      authUrl.searchParams.set(
        "redirect_uri",
        `${window.location.origin}/auth/callback`
      );
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("state", state);

      localStorage.setItem("oauth_state", state);
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error("[Auth] Failed to start OAuth flow:", error);
      // Could show error message to user here
    }
  };

  const logout = async () => {
    // Capture current auth method before clearing it
    const currentAuth = authMethod;

    // Clear local storage and state first
    setAuthMethod(null);
    localStorage.removeItem("auth_method");
    localStorage.removeItem("oauth_state");

    // Clear JWT token from UserDO for security
    if (currentAuth?.userInfo?.id) {
      try {
        console.log("[Auth] Clearing JWT token from UserDO on logout...");
        const clearResponse = await fetch("/api/clear-jwt", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentAuth.apiKey}`
          },
          body: JSON.stringify({
            user_id: currentAuth.userInfo.id
          })
        });

        if (clearResponse.ok) {
          console.log("[Auth] ✅ JWT token cleared from UserDO successfully");
        } else {
          console.warn(
            "[Auth] Failed to clear JWT from UserDO:",
            clearResponse.status
          );
        }
      } catch (error) {
        console.warn("[Auth] Error clearing JWT from UserDO:", error);
      }
    }
  };

  const switchToBYOK = (keys: { openai?: string; anthropic?: string }) => {
    if (!authMethod || authMethod.type !== "atyourservice") return;

    const newAuth: AuthMethod = {
      apiKey: authMethod.apiKey,
      byokKeys: keys, // Keep AtYourService.ai API key for verification
      type: "byok",
      userInfo: authMethod.userInfo
    };

    setAuthMethod(newAuth);
    localStorage.setItem("auth_method", JSON.stringify(newAuth));
  };

  const switchToCredits = () => {
    if (!authMethod || authMethod.type !== "byok") return;

    const newAuth: AuthMethod = {
      apiKey: authMethod.apiKey,
      type: "atyourservice",
      userInfo: authMethod.userInfo
    };

    setAuthMethod(newAuth);
    localStorage.setItem("auth_method", JSON.stringify(newAuth));
  };

  const refreshUserInfo = async () => {
    if (!authMethod || !authMethod.apiKey) return;

    try {
      // Call the local server endpoint that proxies to the gateway
      const response = await fetch("/api/user/info", {
        headers: {
          Authorization: `Bearer ${authMethod.apiKey}`
        },
        method: "GET"
      });

      if (response.ok) {
        const userInfo = (await response.json()) as {
          id: string;
          email: string;
          credits: number;
          starting_balance?: number;
          used_credits?: number;
        };

        // Update the stored auth method with fresh user info
        const updatedAuth = {
          ...authMethod,
          userInfo: {
            credits: userInfo.credits,
            email: userInfo.email,
            id: userInfo.id,
            starting_balance: userInfo.starting_balance,
            used_credits: userInfo.used_credits
          }
        };

        setAuthMethod(updatedAuth);
        localStorage.setItem("auth_method", JSON.stringify(updatedAuth));
      } else {
        console.error(
          "Failed to refresh user info:",
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error refreshing user info:", error);
    }
  };

  const checkTokenExpiration = () => {
    if (!authMethod?.apiKey) return false;

    if (isJWTToken(authMethod.apiKey) && isJWTTokenExpired(authMethod.apiKey)) {
      console.log("[Auth] Token is expired, clearing auth");
      setAuthMethod(null);
      localStorage.removeItem("auth_method");
      localStorage.setItem("auth_expired_token", "true");
      return true;
    }

    return false;
  };

  const value: AuthContextType = {
    authMethod,
    checkTokenExpiration,
    isAuthenticated: !!authMethod,
    isLoading,
    login,
    logout,
    oauthConfig,
    refreshUserInfo,
    switchToBYOK,
    switchToCredits
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
