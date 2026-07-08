"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export { Sheet as BottomSheet, SheetTrigger as BottomSheetTrigger };

export function BottomSheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SheetContent>) {
  return (
    <SheetContent
      side="bottom"
      showCloseButton={false}
      className={cn(
        "max-h-[92dvh] gap-0 overflow-y-auto rounded-t-[24px] border-0 border-t-0 px-5 pt-3 pb-8 sm:mx-auto sm:max-w-md",
        className,
      )}
      {...props}
    >
      <div
        className="bg-border mx-auto mb-5 h-0.5 w-10 shrink-0 rounded-full"
        aria-hidden
      />
      {children}
    </SheetContent>
  );
}

export function BottomSheetTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-xl font-bold tracking-tight", className)}
      {...props}
    />
  );
}

export function BottomSheetDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-muted-foreground text-[13px] leading-snug", className)}
      {...props}
    />
  );
}

/** Campo con etiqueta debajo, como en el diseño OpenPencil. */
export function BottomSheetField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
      <p className="text-muted-foreground text-[13px]">{label}</p>
    </div>
  );
}

export function BottomSheetSectionLabel({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-foreground text-[13px] font-medium", className)}
      {...props}
    />
  );
}

export function BottomSheetAmountInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <div className="bg-muted rounded-2xl p-5">
      <input
        className={cn(
          "placeholder:text-muted-foreground/60 w-full bg-transparent text-4xl leading-none font-bold tracking-tight tabular-nums outline-none",
          className,
        )}
        inputMode="decimal"
        {...props}
      />
    </div>
  );
}

export function BottomSheetInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-border bg-card placeholder:text-muted-foreground w-full rounded-xl border px-3.5 py-3.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

export function BottomSheetSearchInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-border bg-card placeholder:text-muted-foreground w-full rounded-xl border px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

export function BottomSheetPill({
  active,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] transition-colors select-none",
        active
          ? "bg-primary text-primary-foreground font-medium"
          : "bg-muted text-foreground hover:bg-muted/80",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function BottomSheetPrimaryButton({
  className,
  loading,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button
      className={cn(
        "h-12 w-full rounded-xl text-base font-bold",
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : children}
    </Button>
  );
}

export function BottomSheetForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return <form className={cn("flex flex-col gap-[18px]", className)} {...props} />;
}
