import React, { useState } from "react";
import { useAuth } from "./AuthProvider";

export function AuthHeader() {
  const { authMethod, logout, switchToBYOK, switchToCredits } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!authMethod || !authMethod.userInfo) {
    return null;
  }

  const { userInfo } = authMethod;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
        >
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {userInfo.email.charAt(0).toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {userInfo.email}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {authMethod.type === "atyourservice" ? (
                `$${(userInfo.credits / 100).toFixed(2)} credits`
              ) : (
                "Using your API keys"
              )}
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-neutral-500 transition-transform ${
              showDropdown ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2">
            <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {userInfo.email}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                User ID: {userInfo.id.slice(0, 8)}...
              </div>
            </div>

            <div className="px-4 py-2">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                Payment Method
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (authMethod.type !== "atyourservice") {
                      switchToCredits();
                    }
                    setShowDropdown(false);
                  }}
                  className={`px-2 py-1 text-xs rounded ${
                    authMethod.type === "atyourservice"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                  }`}
                >
                  AI @ Your Service Credits
                </button>
                <button
                  onClick={() => {
                    if (authMethod.type !== "byok") {
                      // For now, just switch with empty keys - user would need to configure them
                      switchToBYOK({ openai: "" });
                    }
                    setShowDropdown(false);
                  }}
                  className={`px-2 py-1 text-xs rounded ${
                    authMethod.type === "byok"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                  }`}
                >
                  Your API Keys
                </button>
              </div>
            </div>

            {authMethod.type === "atyourservice" && (
              <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  Credit Balance
                </div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  ${(userInfo.credits / 100).toFixed(2)}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {userInfo.credits < 10 && "Low balance - consider topping up"}
                </div>
              </div>
            )}

            <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2">
              <button
                onClick={() => {
                  logout();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
