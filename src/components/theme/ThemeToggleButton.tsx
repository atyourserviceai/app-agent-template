import { Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type ThemeToggleButtonProps = {
  theme: "dark" | "light";
  onToggle: () => void;
  className?: string;
  title?: string;
};

export function ThemeToggleButton({
  theme,
  onToggle,
  className = "",
  title = "Toggle theme"
}: ThemeToggleButtonProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className={`rounded-full h-9 w-9 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 ${className}`}
      onClick={onToggle}
      title={title}
    >
      {/* Render icon only after mount to ensure SSR/CSR markup matches */}
      <span
        suppressHydrationWarning
        aria-hidden={!isMounted}
        className="flex items-center justify-center"
      >
        {isMounted ? (
          theme === "dark" ? (
            <Sun size={20} />
          ) : (
            <Moon size={20} />
          )
        ) : null}
      </span>
    </button>
  );
}
