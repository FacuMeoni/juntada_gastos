"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita el mismatch de hidratación: hasta montar, no sabemos el tema real.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("rounded-full", className)}
      aria-label={
        mounted
          ? isDark
            ? "Activar modo claro"
            : "Activar modo oscuro"
          : "Cambiar tema"
      }
      onClick={() => {
        if (!mounted) return;
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-5" />
        ) : (
          <Moon className="size-5" />
        )
      ) : (
        // Placeholder neutro durante SSR para mantener el layout estable.
        <Sun className="size-5 opacity-0" />
      )}
    </Button>
  );
}
