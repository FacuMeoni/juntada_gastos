import { AppContainer } from "@/components/layout/app-container";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton inmediato mientras se resuelve `getHomeData()` en el servidor.
 * Evita la pantalla en blanco al navegar a "/".
 */
export default function HomeLoading() {
  return (
    <AppContainer className="gap-4 p-4">
      <header className="flex items-center gap-3 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="size-10 shrink-0 rounded-xl" />
      </header>

      <Skeleton className="h-[76px] w-full rounded-xl" />

      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </AppContainer>
  );
}
