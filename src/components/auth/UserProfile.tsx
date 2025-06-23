import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { User, SignOut, CreditCard, Key } from "@phosphor-icons/react";

export function UserProfile() {
  const { authMethod, logout, switchToBYOK, switchToCredits } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!authMethod || !authMethod.userInfo) {
    return null;
  }

  const { userInfo } = authMethod;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    // Refresh the page to reset everything
    window.location.href = "/";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center justify-center h-9 w-9 bg-blue-500 hover:bg-blue-600 rounded-full text-white text-sm font-semibold transition-colors"
        title={`Signed in as ${userInfo.email}`}
      >
        {userInfo.email.charAt(0).toUpperCase()}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                {userInfo.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {userInfo.email}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  User ID: {userInfo.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="px-4 py-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
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
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  authMethod.type === "atyourservice"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                }`}
              >
                <CreditCard size={12} />
                Credits
              </button>
              <button
                onClick={() => {
                  if (authMethod.type !== "byok") {
                    // For now, just switch with empty keys - user would need to configure them
                    switchToBYOK({ openai: "" });
                  }
                  setShowDropdown(false);
                }}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  authMethod.type === "byok"
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                }`}
              >
                <Key size={12} />
                Your Keys
              </button>
            </div>
          </div>

          {/* Credit Balance Section (only for atyourservice) */}
          {authMethod.type === "atyourservice" && (
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                Credit Balance
              </div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                ${(userInfo.credits / 100).toFixed(2)}
              </div>
              {userInfo.credits < 10 && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Low balance - consider topping up
                </div>
              )}
              <a
                href="https://atyourservice.ai/account"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Manage credits →
              </a>
            </div>
          )}

          {/* Sign Out */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <SignOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
