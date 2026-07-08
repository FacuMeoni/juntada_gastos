"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContainer } from "@/components/layout/app-container";
import { PageBackHeader } from "@/components/layout/page-back-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ProfilePageShell({
  userId,
  initialName,
  initialAlias,
  initialAvatarUrl,
  email,
}: {
  userId: string;
  initialName: string;
  initialAlias: string;
  initialAvatarUrl: string | null;
  email: string;
}) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const navigateAway = useCallback(
    (href: string) => {
      if (isDirty) {
        setPendingHref(href);
        setConfirmOpen(true);
        return;
      }
      router.push(href);
    },
    [isDirty, router],
  );

  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleDiscard = () => {
    setConfirmOpen(false);
    const href = pendingHref ?? "/";
    setPendingHref(null);
    router.push(href);
  };

  const handleContinueEditing = () => {
    setConfirmOpen(false);
    setPendingHref(null);
  };

  return (
    <AppContainer className="gap-4 p-4">
      <PageBackHeader
        title="Mi perfil"
        onBack={() => navigateAway("/")}
        action={
          <ThemeToggle className="bg-card size-10 shrink-0 rounded-xl border border-border shadow-none" />
        }
      />

      <ProfileForm
        userId={userId}
        initialName={initialName}
        initialAlias={initialAlias}
        initialAvatarUrl={initialAvatarUrl}
        email={email}
        onDirtyChange={setIsDirty}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Descartar cambios?</DialogTitle>
            <DialogDescription>
              Tenés cambios sin guardar en tu perfil. Si salís ahora, se van a
              perder.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              className="w-full"
              onClick={handleContinueEditing}
            >
              Seguir editando
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDiscard}
            >
              Descartar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppContainer>
  );
}
