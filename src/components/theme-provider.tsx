"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark" | undefined;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme): "light" | "dark" {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<
    "light" | "dark" | undefined
  >(undefined);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    let stored: Theme = defaultTheme;
    try {
      stored = (localStorage.getItem(storageKey) as Theme | null) ?? defaultTheme;
    } catch {
      // localStorage puede estar bloqueado
    }
    // Sincroniza el estado de React con lo que ya aplicó el script del layout.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-mount sync
    setThemeState(stored);
    setResolvedTheme(applyTheme(stored));
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (themeRef.current === "system") {
        setResolvedTheme(applyTheme("system"));
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      setResolvedTheme(applyTheme(next));
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // ignore
      }
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
