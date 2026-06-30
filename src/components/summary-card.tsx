import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const cardClassName =
  "border-0 bg-white text-neutral-900 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-white dark:ring-foreground/10";

const mutedClassName = "text-xs text-neutral-500 dark:text-neutral-400";

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

/** Card de resumen: blanca en modo claro, oscura en modo oscuro. */
export function SummaryCard({
  icon,
  primary,
  secondary,
  className,
}: SummaryCardProps) {
  return (
    <Card className={cn(cardClassName, className)}>
      <CardContent
        className={cn(
          "flex items-center gap-4",
          secondary && "justify-between gap-4",
        )}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="icon-surface flex size-11 shrink-0 items-center justify-center rounded-xl">
            {icon}
          </div>
          <div className="min-w-0">
            <p className={mutedClassName}>{primary.label}</p>
            <p className="text-2xl font-bold">{primary.value}</p>
          </div>
        </div>

        {secondary && (
          <div className="shrink-0 text-right">
            <p className={mutedClassName}>{secondary.label}</p>
            <p
              className={cn(
                "text-lg font-semibold",
                secondary.muted && "text-neutral-500 dark:text-neutral-400",
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
