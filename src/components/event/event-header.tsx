"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEvent } from "@/components/event/event-context";
import { EventMembersDialog } from "@/components/event/event-members-dialog";

export function EventHeader() {
  const { eventName } = useEvent();

  return (
    <header className="flex shrink-0 items-center gap-2 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
      <Link
        href="/"
        aria-label="Volver al inicio"
        className="text-foreground hover:bg-muted flex size-6 shrink-0 items-center justify-center rounded-full transition-colors"
      >
        <ChevronLeft className="size-[22px]" strokeWidth={2} />
      </Link>

      <h1 className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight">
        {eventName}
      </h1>

      <EventMembersDialog />
    </header>
  );
}
