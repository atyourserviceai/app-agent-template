import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

export function useThemePreference() {
  // Always start with "dark" for consistent SSR/CSR hydration
  const [theme, setTheme] = useState<Theme>("dark");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved theme from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true);
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      } else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
        setTheme("light");
      }
    } catch {}
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (!isHydrated) return;

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme, isHydrated]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, setTheme, toggleTheme } as const;
}
