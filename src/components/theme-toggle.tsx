"use client";

import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Cross-fade de iconos sin librería de motion: ambos viven en el DOM y ninguno desmonta. */
const crossfade =
  "transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("rounded-full", className)}
      aria-label={
        resolvedTheme === "dark" ? "Activar modo claro" : "Activar modo oscuro"
      }
      onClick={() => {
        if (!resolvedTheme) return;
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
    >
      {/* El estado sale de la clase `.dark` del html, la misma fuente que los colores: sin parpadeo al montar. */}
      <span className="relative flex size-5 items-center justify-center">
        <Sun
          className={cn(
            crossfade,
            "absolute size-5 scale-[0.25] opacity-0 blur-[4px] dark:scale-100 dark:opacity-100 dark:blur-0",
          )}
        />
        <Moon
          className={cn(
            crossfade,
            "size-5 scale-100 opacity-100 blur-0 dark:scale-[0.25] dark:opacity-0 dark:blur-[4px]",
          )}
        />
      </span>
    </Button>
  );
}
