"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageBackHeader({
  title,
  backHref = "/",
  backLabel = "Volver al inicio",
  onBack,
  action,
  className,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  className?: string;
}) {
  const backClassName =
    "text-foreground hover:bg-muted flex size-6 shrink-0 items-center justify-center rounded-full transition-colors";

  return (
    <header
      className={cn(
        "flex items-center gap-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))]",
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className={backClassName}
        >
          <ChevronLeft className="size-[22px]" strokeWidth={2} />
        </button>
      ) : (
        <Link href={backHref} aria-label={backLabel} className={backClassName}>
          <ChevronLeft className="size-[22px]" strokeWidth={2} />
        </Link>
      )}

      <h1 className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight">
        {title}
      </h1>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
