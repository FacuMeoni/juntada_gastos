"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeManagedMember } from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { memberDisplayName } from "@/lib/debt";
import { memberRemovalStats } from "@/lib/member-removal";
import type { Member } from "@/types";
import { cn } from "@/lib/utils";

type Strategy = "delete_expenses" | "reassign_expenses";

export function RemoveManagedMemberDialog({
  member,
  open,
  onOpenChange,
}: {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { eventId, members, expenses, payments, refetch } = useEvent();
  const [isPending, startTransition] = useTransition();

  const name = memberDisplayName(member);
  const stats = useMemo(
    () => memberRemovalStats(member.id, expenses, payments),
    [member.id, expenses, payments],
  );

  const otherMembers = useMemo(
    () => members.filter((m) => m.id !== member.id),
    [members, member.id],
  );

  const [strategy, setStrategy] = useState<Strategy>("reassign_expenses");
  const [reassignTo, setReassignTo] = useState<string>(
    () => otherMembers[0]?.id ?? "",
  );

  const hasPaidExpenses = stats.paidExpenseCount > 0;
  const canReassign = otherMembers.length > 0;

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setStrategy(canReassign && hasPaidExpenses ? "reassign_expenses" : "delete_expenses");
      setReassignTo(otherMembers[0]?.id ?? "");
    }
    onOpenChange(next);
  };

  const handleConfirm = () => {
    if (strategy === "reassign_expenses" && !reassignTo) {
      toast.error("Elegí a quién reasignar los gastos.");
      return;
    }

    startTransition(async () => {
      const res = await removeManagedMember({
        eventId,
        memberId: member.id,
        strategy: hasPaidExpenses ? strategy : "delete_expenses",
        reassignToMemberId:
          hasPaidExpenses && strategy === "reassign_expenses"
            ? reassignTo
            : undefined,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`${name} fue eliminado`);
      onOpenChange(false);
      await refetch();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar a {name}?</DialogTitle>
          <DialogDescription>
            Es un participante gestionado. Podés sacarlo del grupo y decidir qué
            hacer con su historial.
          </DialogDescription>
        </DialogHeader>

        {(stats.paymentCount > 0 || stats.splitCount > 0) && (
          <ul className="text-muted-foreground list-inside list-disc space-y-0.5 text-sm">
            {stats.paymentCount > 0 && (
              <li>
                {stats.paymentCount}{" "}
                {stats.paymentCount === 1 ? "pago registrado" : "pagos registrados"}{" "}
                (se eliminarán)
              </li>
            )}
            {stats.splitCount > 0 && (
              <li>
                Participó en {stats.splitCount}{" "}
                {stats.splitCount === 1 ? "reparto" : "repartos"} (se quitará de
                esos gastos)
              </li>
            )}
          </ul>
        )}

        {hasPaidExpenses && (
          <div className="space-y-3">
            <Label>
              Pagó {stats.paidExpenseCount}{" "}
              {stats.paidExpenseCount === 1 ? "gasto" : "gastos"}
            </Label>
            <div className="grid gap-2">
              <button
                type="button"
                disabled={!canReassign}
                onClick={() => setStrategy("reassign_expenses")}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left text-sm transition",
                  strategy === "reassign_expenses"
                    ? "border-foreground bg-muted"
                    : "hover:bg-muted/50",
                  !canReassign && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="font-medium">Reasignar gastos</span>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Los gastos que pagó pasan a otro participante.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setStrategy("delete_expenses")}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left text-sm transition",
                  strategy === "delete_expenses"
                    ? "border-foreground bg-muted"
                    : "hover:bg-muted/50",
                )}
              >
                <span className="font-medium">Eliminar gastos</span>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Se borran los gastos que registró como pagador.
                </p>
              </button>
            </div>

            {strategy === "reassign_expenses" && canReassign && (
              <div className="space-y-2">
                <Label>Reasignar a</Label>
                <div className="flex flex-wrap gap-2">
                  {otherMembers.map((m) => (
                    <Button
                      key={m.id}
                      type="button"
                      size="sm"
                      variant={reassignTo === m.id ? "default" : "outline"}
                      onClick={() => setReassignTo(m.id)}
                    >
                      {memberDisplayName(m)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Eliminar participante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
