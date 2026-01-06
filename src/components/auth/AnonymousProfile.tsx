import { ArrowCounterClockwise, Info, SignIn, User } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

interface AnonymousProfileProps {
  onShowLandingPage?: () => void;
}

export function AnonymousProfile({ onShowLandingPage }: AnonymousProfileProps) {
  const { login } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
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

  const handleSignIn = () => {
    login();
    setShowDropdown(false);
  };

  const handleResetSimulation = () => {
    localStorage.removeItem("instructions_dismissed");
    localStorage.removeItem("landing_dismissed");
    setShowDropdown(false);
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center justify-center h-9 w-9 bg-neutral-400 dark:bg-neutral-600 hover:bg-neutral-500 dark:hover:bg-neutral-500 rounded-full text-white text-sm font-semibold transition-colors"
        title="Sign in to use AI chat"
      >
        <User size={18} weight="bold" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-400 dark:bg-neutral-600 rounded-full flex items-center justify-center text-white">
                <User size={20} weight="bold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Anonymous
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Sign in to use AI chat
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 space-y-2">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              Sign in to control the simulation with AI chat and unlock all features.
            </p>
            <button
              type="button"
              onClick={handleSignIn}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              <SignIn size={16} />
              Sign in
            </button>
            {onShowLandingPage && (
              <button
                type="button"
                onClick={() => {
                  onShowLandingPage();
                  setShowDropdown(false);
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 font-medium rounded-lg transition-colors text-sm"
              >
                <Info size={16} />
                About this app
              </button>
            )}
          </div>

          {/* Reset Options */}
          <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 space-y-1">
            <button
              type="button"
              onClick={handleResetSimulation}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors text-sm"
            >
              <ArrowCounterClockwise size={16} />
              Reset & Show Intro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
