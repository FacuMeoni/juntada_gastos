"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Si es true, sólo está activo cuando el pathname coincide exactamente. */
  exact?: boolean;
}

/**
 * Barra de navegación inferior fija (mobile-first).
 * Reutilizable: la pasamos distintos `items` según el contexto
 * (app global vs. dentro de una juntada).
 */
export function BottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="bottom-safe fixed inset-x-0 z-50 mx-auto w-full max-w-md">
      <div className="bg-background/95 border-border flex items-stretch border-t backdrop-blur">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                className={cn("size-5", isActive && "stroke-[2.5]")}
                aria-hidden
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="bg-background/95 pb-safe" />
    </nav>
  );
}
