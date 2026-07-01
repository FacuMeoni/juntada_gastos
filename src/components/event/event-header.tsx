"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useEvent } from "@/components/event/event-context";
import { EventMembersDialog } from "@/components/event/event-members-dialog";

const SECTION_LABELS: Record<string, string> = {
  saldar: "Saldar",
  historial: "Historial",
  ajustes: "Ajustes",
};

export function EventHeader() {
  const { eventId, eventName } = useEvent();
  const pathname = usePathname();

  const eventBase = `/${eventId}`;
  const sectionSlug = pathname.startsWith(eventBase)
    ? pathname.slice(eventBase.length).replace(/^\//, "")
    : "";
  const sectionLabel = sectionSlug ? SECTION_LABELS[sectionSlug] : null;
  const isSubPage = Boolean(sectionLabel);

  const backHref = isSubPage ? eventBase : "/";

  return (
    <header className="bg-background/80 z-40 flex shrink-0 items-center gap-1.5 border-b px-4 py-2.5">
      <Link
        href={backHref}
        aria-label={isSubPage ? "Volver a la juntada" : "Volver al inicio"}
        className="text-muted-foreground hover:text-foreground hover:bg-muted -ml-1.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
      >
        <ChevronLeft className="size-4" />
      </Link>

      <nav
        aria-label="Ubicación"
        className="min-w-0 flex-1 truncate text-sm leading-tight"
      >
        {isSubPage ? (
          <span className="flex min-w-0 items-baseline gap-1.5 truncate">
            <Link
              href={eventBase}
              className="text-muted-foreground hover:text-foreground truncate font-medium transition-colors"
            >
              {eventName}
            </Link>
            <span className="text-muted-foreground/50 shrink-0" aria-hidden>
              /
            </span>
            <span className="text-muted-foreground shrink-0">{sectionLabel}</span>
          </span>
        ) : (
          <span className="text-foreground truncate font-medium">{eventName}</span>
        )}
      </nav>

      <EventMembersDialog />
    </header>
  );
}
