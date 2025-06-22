import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

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
  login: () => void;
  logout: () => void;
  switchToBYOK: (keys: { openai?: string; anthropic?: string }) => void;
  switchToCredits: () => void;
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

  useEffect(() => {
    // Check for stored auth on component mount
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
  }, []);

  const login = () => {
    // For browser-side OAuth initiation, determine URL based on current hostname
    const isDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const authUrl = isDev
      ? "http://127.0.0.1:45173/oauth/authorize"
      : "https://atyourservice.ai/oauth/authorize";

    const state = Math.random().toString(36).substring(2);

    const url = new URL(authUrl);
    url.searchParams.set("client_id", "app-agent-template");
    url.searchParams.set(
      "redirect_uri",
      `${window.location.origin}/auth/callback`
    );
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "api_access credit_usage agent_fuel");
    url.searchParams.set("state", state);

    localStorage.setItem("oauth_state", state);
    window.location.href = url.toString();
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

  const value: AuthContextType = {
    authMethod,
    isAuthenticated: !!authMethod,
    isLoading,
    login,
    logout,
    switchToBYOK,
    switchToCredits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
