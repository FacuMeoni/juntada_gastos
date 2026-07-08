"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("rounded-full", className)}
      aria-label="Cerrar sesión"
      disabled={isPending}
      onClick={() => startTransition(async () => void (await signOut()))}
    >
      <LogOut className="size-5" />
    </Button>
  );
}
