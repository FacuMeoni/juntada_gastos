import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  icon: React.ReactNode;
  primary: { label: string; value: string };
  secondary?: {
    label: string;
    value: string;
    /** Texto secundario atenuado (ej. "Al día"). */
    muted?: boolean;
  };
  className?: string;
}

/** Card de resumen según diseño OpenPencil (monocromático). */
export function SummaryCard({
  icon,
  primary,
  secondary,
  className,
}: SummaryCardProps) {
  return (
    <Card className={className}>
      <CardContent
        className={cn(
          "flex items-center gap-3 p-4",
          secondary && "justify-between gap-4",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="icon-surface flex size-11 shrink-0 items-center justify-center rounded-xl">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs leading-none">
              {primary.label}
            </p>
            <p className="mt-1 text-2xl leading-none font-bold tracking-tight tabular-nums">
              {primary.value}
            </p>
          </div>
        </div>

        {secondary && (
          <div className="shrink-0 text-right">
            <p className="text-muted-foreground text-xs leading-none">
              {secondary.label}
            </p>
            <p
              className={cn(
                "mt-1 text-lg leading-none font-semibold tabular-nums",
                secondary.muted && "text-muted-foreground font-medium",
              )}
            >
              {secondary.value}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
