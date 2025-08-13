import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

export function useThemePreference() {
  // Start with a deterministic value to avoid SSR/CSR mismatches.
  // We'll reconcile to the user's preference after hydration.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // On mount, detect user/system preference and reconcile if different
    const saved = localStorage.getItem("theme");
    let preferred: Theme | null = null;
    if (saved === "dark" || saved === "light") preferred = saved;
    else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches)
      preferred = "dark";
    else preferred = "light";

    if (preferred && preferred !== theme) setTheme(preferred);
  }, [theme]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, setTheme, toggleTheme } as const;
}
