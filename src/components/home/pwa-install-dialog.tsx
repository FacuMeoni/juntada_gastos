"use client";

import { useState, useSyncExternalStore } from "react";
import {
  CheckCircle2,
  Download,
  Share,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("size-4 shrink-0", className)}
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("size-4 shrink-0", className)}
    >
      <path d="M17.6 9.48 19.44 6.3c.16-.31.04-.67-.27-.83-.31-.16-.67-.04-.83.27l-1.87 3.22c-1.45-.64-3.07-.99-4.77-.99s-3.32.35-4.77.99L6.09 5.74c-.16-.31-.52-.43-.83-.27-.31.16-.43.52-.27.83l1.84 3.18C4.84 11.36 3.5 13.5 3.5 16h17c0-2.5-1.34-4.64-3.4-6.52zM7 14.5c-.83 0-1.5-.67-1.5-1.5S6.17 11.5 7 11.5s1.5.67 1.5 1.5S7.83 14.5 7 14.5zm10 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

function PlatformSectionHeader({
  platform,
}: {
  platform: "ios" | "android";
}) {
  const isIos = platform === "ios";

  return (
    <p className="mb-4 flex items-center gap-2 text-sm font-medium">
      {isIos ? <AppleIcon /> : <AndroidIcon />}
      {isIos ? "iPhone / iPad" : "Android"}
    </p>
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function detectPlatform(): "ios" | "android" | "other" {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

function subscribe() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

function Step({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
        {number}
      </span>
      <span className="text-muted-foreground pt-1 text-[13px] leading-relaxed">
        {children}
      </span>
    </li>
  );
}

function IosStepsList() {
  return (
    <ol className="space-y-5">
      <Step number={1}>Abrí esta página en Safari.</Step>
      <Step number={2}>
        Tocá{" "}
        <Share className="text-foreground inline size-4 align-text-bottom" />{" "}
        <strong className="text-foreground font-medium">Compartir</strong>{" "}
        (abajo en el centro).
      </Step>
      <Step number={3}>
        Elegí{" "}
        <strong className="text-foreground font-medium">
          Agregar a inicio
        </strong>
        .
      </Step>
      <Step number={4}>Confirmá con Agregar.</Step>
    </ol>
  );
}

function AndroidStepsList() {
  return (
    <ol className="space-y-5">
      <Step number={1}>Abrí esta página en Chrome.</Step>
      <Step number={2}>
        Tocá el menú{" "}
        <strong className="text-foreground font-medium">⋮</strong> arriba a la
        derecha.
      </Step>
      <Step number={3}>
        Elegí{" "}
        <strong className="text-foreground font-medium">Instalar app</strong> o{" "}
        <strong className="text-foreground font-medium">
          Agregar a pantalla de inicio
        </strong>
        .
      </Step>
      <Step number={4}>Confirmá la instalación.</Step>
    </ol>
  );
}

function InstallSteps({ platform }: { platform: "ios" | "android" | "other" }) {
  if (platform === "ios") {
    return (
      <div>
        <PlatformSectionHeader platform="ios" />
        <IosStepsList />
      </div>
    );
  }

  if (platform === "android") {
    return (
      <div>
        <PlatformSectionHeader platform="android" />
        <AndroidStepsList />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <PlatformSectionHeader platform="ios" />
        <IosStepsList />
      </div>
      <div>
        <PlatformSectionHeader platform="android" />
        <AndroidStepsList />
      </div>
    </div>
  );
}

export function PwaInstallDialog() {
  const mounted = useIsClient();
  const installed = useSyncExternalStore(subscribe, isStandalone, () => false);
  const platform = useSyncExternalStore(
    subscribe,
    detectPlatform,
    () => "other" as const,
  );
  const [open, setOpen] = useState(false);

  if (!mounted || installed) return null;

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="bg-card size-10 shrink-0 rounded-xl border border-border shadow-none"
            aria-label="Instalar app en el teléfono"
          />
        }
      >
        <Download className="size-[18px]" strokeWidth={2} />
      </BottomSheetTrigger>

      <BottomSheetContent className="bg-card">
        <div className="flex flex-col gap-7 pb-2">
          <div className="space-y-2">
            <BottomSheetTitle>Instalá JuntadasApp</BottomSheetTitle>
            <BottomSheetDescription className="leading-relaxed">
              Sumala al inicio de tu teléfono y abrila como una app, sin pasar por
              el navegador.
            </BottomSheetDescription>
          </div>

          <InstallSteps platform={platform} />
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export function PwaInstalledBadge() {
  const mounted = useIsClient();
  const installed = useSyncExternalStore(subscribe, isStandalone, () => false);

  if (!mounted || !installed) return null;

  return (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      <CheckCircle2 className="size-4 shrink-0" />
      App instalada en tu teléfono
    </div>
  );
}
