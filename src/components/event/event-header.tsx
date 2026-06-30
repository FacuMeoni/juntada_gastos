"use client";

import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";
import { useEvent } from "@/components/event/event-context";

export function EventHeader() {
  const { eventName, members } = useEvent();

  return (
    <header className="bg-background/80 z-40 flex shrink-0 items-center gap-2 border-b px-4 py-3">
      <Link
        href="/"
        aria-label="Volver al inicio"
        className="hover:bg-muted -ml-2 flex size-9 shrink-0 items-center justify-center rounded-full"
      >
        <ChevronLeft className="size-5" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">
        {eventName}
      </h1>
      <div
        className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-sm tabular-nums"
        aria-label={`${members.length} participantes`}
      >
        <Users className="size-4" aria-hidden />
        <span>{members.length}</span>
      </div>
    </header>
  );
}
