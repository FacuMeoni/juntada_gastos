import { cn } from "@/lib/utils";

/**
 * Contenedor mobile-first centrado. Limita el ancho en pantallas grandes
 * para mantener la sensación de app móvil.
 */
export function AppContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-background relative mx-auto flex min-h-dvh w-full max-w-md flex-col",
        className,
      )}
    >
      {children}
    </div>
  );
}
