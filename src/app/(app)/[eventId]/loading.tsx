import { AppContainer } from "@/components/layout/app-container";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton inmediato mientras el layout de la juntada valida el acceso y
 * precarga miembros/gastos/pagos en el servidor.
 */
export default function EventLoading() {
  return (
    <AppContainer className="min-h-0 h-dvh max-h-dvh">
      <div className="bg-card border-border shrink-0 border-b">
        <header className="flex shrink-0 items-center gap-2 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <Skeleton className="h-6 w-32 flex-1" />
          <Skeleton className="size-8 shrink-0 rounded-full" />
        </header>
        <nav className="flex shrink-0 gap-3 px-4 pb-2">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </nav>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </AppContainer>
  );
}
