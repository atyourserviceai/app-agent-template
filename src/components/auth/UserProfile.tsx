import { SignOut } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

export function UserProfile() {
  const { authMethod, logout, refreshUserInfo, oauthConfig } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  if (!authMethod || !authMethod.userInfo) {
    return null;
  }

  const { userInfo } = authMethod;

  // Extract base URL from OAuth auth_url and construct account URL
  const accountUrl = oauthConfig
    ? new URL("/account", oauthConfig.auth_url).toString()
    : "https://atyourservice.ai/account"; // fallback

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    // Refresh the page to reset everything
    window.location.href = "/";
  };

  const handleDropdownToggle = async () => {
    const newShowState = !showDropdown;
    setShowDropdown(newShowState);

    // Refresh user info when opening dropdown to get current credit balance
    if (newShowState && authMethod?.type === "atyourservice") {
      setIsRefreshing(true);
      try {
        await refreshUserInfo();
      } catch (error) {
        console.error("Failed to refresh user info:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleDropdownToggle}
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
              </div>
            </div>
          </div>

          {/* Credit Balance Section */}
          <div className="px-4 py-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Credit Balance
              {isRefreshing && (
                <span className="ml-1 inline-block animate-spin">⟳</span>
              )}
            </div>
            {userInfo.credits !== undefined ? (
              <>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  ${userInfo.credits.toFixed(2)}
                </div>
                {userInfo.credits < 1 && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Low balance - consider topping up
                  </div>
                )}
                <a
                  href={accountUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Manage credits →
                </a>
              </>
            ) : (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Loading...
              </div>
            )}
          </div>

          {/* Sign Out */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
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
