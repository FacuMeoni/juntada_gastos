import { cn } from "@/lib/utils";

/**
 * Contenedor mobile-first centrado. Limita el ancho en pantallas grandes
 * para mantener la sensación de app móvil.
 */
export function AppContainer({
  children,
  className,
  withBottomNav = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Agrega padding inferior para no tapar contenido con el bottom nav fijo. */
  withBottomNav?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-background relative mx-auto flex w-full max-w-md flex-col shadow-sm",
        withBottomNav
          ? "h-dvh max-h-dvh overflow-hidden pb-20"
          : "min-h-dvh",
        className,
      )}
    >
      {children}
    </div>
  );
}
