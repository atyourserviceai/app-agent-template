import React from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { authMethod, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authMethod) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🤖 App Agent Template
            </h1>
            <p className="text-lg text-gray-600 mb-1">
              Customizable AI Agent Platform
            </p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-4">
              This app uses AtYourService.ai to fuel the AI. Sign in to get
              started:
            </p>
            <div className="space-y-2 text-sm text-left">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Get $5 in free credits</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Your own private agent instance</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Choose credits or BYOK (advanced)</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Track usage in your dashboard</span>
              </div>
            </div>
          </div>

          <button
            onClick={login}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🎯 Sign in with AtYourService.ai
          </button>

          <div className="mt-4">
            <a
              href="https://atyourservice.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ℹ️ Learn more about AtYourService.ai
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
