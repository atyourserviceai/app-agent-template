import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null);

  // Function to sync token with agent database
  const syncTokenWithAgent = useCallback(async (authData: AuthMethod) => {
    if (!authData.userInfo?.id || !authData.apiKey) return;

    try {
      console.log(
        `[Auth] Syncing token with agent for user: ${authData.userInfo.id}`
      );

      const response = await fetch(
        `/agents/app-agent/${authData.userInfo.id}/store-user-info`,
        {
          body: JSON.stringify({
            api_key: authData.apiKey,
            credits: authData.userInfo.credits,
            email: authData.userInfo.email,
            user_id: authData.userInfo.id,
          }),
          headers: {
            Authorization: `Bearer ${authData.apiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      );

      if (response.ok) {
        console.log(
          `[Auth] ✅ Token synced with agent for user: ${authData.userInfo.id}`
        );
      } else {
        console.warn(
          `[Auth] Failed to sync token with agent:`,
          response.status
        );
      }
    } catch (error) {
      console.warn(`[Auth] Error syncing token with agent:`, error);
    }
  }, []);

  useEffect(() => {
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
                  Authorization: `Bearer ${parsedAuth.apiKey}`,
                },
                method: "GET",
              });

              if (response.ok) {
                // Token is valid, use the stored auth and sync with agent
                setAuthMethod(parsedAuth);
                await syncTokenWithAgent(parsedAuth);
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
  }, [syncTokenWithAgent]);

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

    // Also clear the agent's cached user data if we have valid auth info
    if (currentAuth?.userInfo?.id && currentAuth?.apiKey) {
      try {
        console.log("[Auth] Clearing agent cached data on logout...");
        const clearResponse = await fetch(
          `/agents/app-agent/${currentAuth.userInfo.id}/clear-user-info`,
          {
            headers: {
              Authorization: `Bearer ${currentAuth.apiKey}`,
              "Content-Type": "application/json",
            },
            method: "POST",
          }
        );

        if (clearResponse.ok) {
          console.log("[Auth] Successfully cleared agent cached data");
        } else {
          console.warn(
            "[Auth] Failed to clear agent cached data:",
            clearResponse.status
          );
        }
      } catch (error) {
        console.warn("[Auth] Error clearing agent cached data:", error);
      }
    }
  };

  const switchToBYOK = (keys: { openai?: string; anthropic?: string }) => {
    if (!authMethod || authMethod.type !== "atyourservice") return;

    const newAuth: AuthMethod = {
      apiKey: authMethod.apiKey,
      byokKeys: keys, // Keep AtYourService.ai API key for verification
      type: "byok",
      userInfo: authMethod.userInfo,
    };

    setAuthMethod(newAuth);
    localStorage.setItem("auth_method", JSON.stringify(newAuth));
  };

  const switchToCredits = () => {
    if (!authMethod || authMethod.type !== "byok") return;

    const newAuth: AuthMethod = {
      apiKey: authMethod.apiKey,
      type: "atyourservice",
      userInfo: authMethod.userInfo,
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
          Authorization: `Bearer ${authMethod.apiKey}`,
        },
        method: "GET",
      });

      if (response.ok) {
        const userInfo = (await response.json()) as {
          id: string;
          email: string;
          credits: number;
        };

        // Update the stored auth method with fresh user info
        const updatedAuth = {
          ...authMethod,
          userInfo: {
            credits: userInfo.credits,
            email: userInfo.email,
            id: userInfo.id,
          },
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
    switchToCredits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
