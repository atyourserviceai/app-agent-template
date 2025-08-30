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
        <div className="absolute left-0 right-auto md:left-auto md:right-0 mt-2 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-10">
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
            {userInfo.credits !== undefined ? (
              <>
                <div className="bg-blue-500/20 dark:bg-blue-400/20 p-3 rounded text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      User Balance
                      {isRefreshing && (
                        <span className="ml-1 inline-block animate-spin">
                          ⟳
                        </span>
                      )}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      ${userInfo.credits.toFixed(2)} remaining
                    </span>
                  </div>
                  <div className="relative bg-neutral-200 dark:bg-neutral-700 h-2 rounded overflow-hidden">
                    {/* Used portion (gray background shows through) */}
                    {/* Remaining portion (blue or yellow overlay depending on balance) */}
                    <div
                      className={`h-full transition-all duration-300 ${
                        userInfo.credits < 0.2
                          ? "bg-yellow-500 dark:bg-yellow-400"
                          : "bg-blue-500 dark:bg-blue-400"
                      }`}
                      style={{
                        width: `${Math.min(Math.max((userInfo.credits / (userInfo.starting_balance || 10)) * 100, 0), 100)}%`
                      }}
                    />
                  </div>
                </div>
                {userInfo.credits < 0.2 && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    Low balance - consider topping up
                  </div>
                )}
                <a
                  href={accountUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 block"
                >
                  Manage credits →
                </a>
              </>
            ) : (
              <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    User Balance
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Loading...
                  </span>
                </div>
                <div className="bg-neutral-200 dark:bg-neutral-700 h-2 rounded overflow-hidden">
                  <div className="bg-neutral-400 dark:bg-neutral-500 h-full w-0 rounded animate-pulse" />
                </div>
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
