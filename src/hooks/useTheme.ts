import { useCallback, useEffect, useState } from "react";

type Theme = "dark" | "light";
const KEY = "silk-cocoon-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY) as Theme | null;
    const initial: Theme = stored ?? "dark";
    setTheme(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(KEY, theme);
  }, [theme, mounted]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return { theme, toggle, mounted };
}