"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvent } from "@/components/event/event-context";
import { Skeleton } from "@/components/ui/skeleton";

/** Muestra skeleton mientras carga y un mensaje si hubo error. */
export function EventStateGuard({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  /** Si es false, el scroll queda a cargo del contenido hijo. */
  scroll?: boolean;
}) {
  const { loading, error, debt } = useEvent();

  if (loading && !debt) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center text-sm">
        <AlertCircle className="text-foreground size-8" />
        <p>No se pudieron cargar los datos.</p>
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-0 flex-1",
        scroll && "overflow-y-auto overscroll-y-contain",
      )}
    >
      {children}
    </div>
  );
}
