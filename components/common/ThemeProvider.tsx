"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ThemeProviderProps } from "@/types/layout";
import type { Theme, ThemeContextValue } from "@/types/theme";

const THEME_STORAGE_KEY = "reexplain-theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const systemTheme = (): Theme =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(theme);
};

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setCurrentTheme] = useState<Theme>("light");

  const setTheme = useCallback((nextTheme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    setCurrentTheme(nextTheme);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme: Theme = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : systemTheme();

    const timeoutId = window.setTimeout(() => {
      applyTheme(initialTheme);
      setCurrentTheme(initialTheme);
    });

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <ThemeContext.Provider value={{ setTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
};

export default ThemeProvider;
export { useTheme };
