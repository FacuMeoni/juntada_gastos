"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { slug: "", label: "Gastos" },
  { slug: "saldar", label: "Saldar" },
  { slug: "historial", label: "Historial" },
  { slug: "ajustes", label: "Ajustes" },
] as const;

export function EventTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/${eventId}`;

  return (
    <nav
      aria-label="Secciones de la juntada"
      className="flex shrink-0 gap-1 overflow-x-auto px-2"
    >
      {SECTIONS.map(({ slug, label }) => {
        const href = slug ? `${base}/${slug}` : base;
        const isActive = slug
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === base;

        return (
          <Link
            key={slug || "gastos"}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative shrink-0 px-3 py-2.5 text-sm transition-colors select-none",
              isActive
                ? "font-medium text-foreground"
                : "font-normal text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {isActive && (
              <span className="bg-foreground absolute inset-x-3 bottom-0 h-0.5 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
