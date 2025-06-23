import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getOAuthConfig, type OAuthConfig } from "../../config/oauth";

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
          setAuthMethod(parsedAuth);
        } catch (e) {
          console.error("Invalid stored auth:", e);
          localStorage.removeItem("auth_method");
        }
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const login = async () => {
    try {
      const config = oauthConfig || await getOAuthConfig();
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

  const logout = () => {
    setAuthMethod(null);
    localStorage.removeItem("auth_method");
    localStorage.removeItem("oauth_state");
  };

  const switchToBYOK = (keys: { openai?: string; anthropic?: string }) => {
    if (!authMethod || authMethod.type !== "atyourservice") return;

    const newAuth: AuthMethod = {
      type: "byok",
      apiKey: authMethod.apiKey, // Keep AtYourService.ai API key for verification
      userInfo: authMethod.userInfo,
      byokKeys: keys,
    };

    setAuthMethod(newAuth);
    localStorage.setItem("auth_method", JSON.stringify(newAuth));
  };

  const switchToCredits = () => {
    if (!authMethod || authMethod.type !== "byok") return;

    const newAuth: AuthMethod = {
      type: "atyourservice",
      apiKey: authMethod.apiKey,
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
        method: "GET",
        headers: {
          Authorization: `Bearer ${authMethod.apiKey}`,
        },
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
            id: userInfo.id,
            email: userInfo.email,
            credits: userInfo.credits,
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

  const value: AuthContextType = {
    authMethod,
    isAuthenticated: !!authMethod,
    isLoading,
    oauthConfig,
    login,
    logout,
    switchToBYOK,
    switchToCredits,
    refreshUserInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
