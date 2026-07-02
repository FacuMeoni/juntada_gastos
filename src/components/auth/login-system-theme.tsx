"use client";

import { useEffect } from "react";

function applyThemeClass(mode: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(mode);
  root.style.colorScheme = mode;
}

function resolveStoredTheme(stored: string | null): "light" | "dark" {
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** En login/register: solo tema del sistema, sin toggle ni pisar localStorage. */
export function LoginSystemTheme({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applySystem = () => {
      applyThemeClass(media.matches ? "dark" : "light");
    };

    applySystem();
    media.addEventListener("change", applySystem);

    return () => {
      media.removeEventListener("change", applySystem);
      applyThemeClass(resolveStoredTheme(stored));
    };
  }, []);

  return children;
}
