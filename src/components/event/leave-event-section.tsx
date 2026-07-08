"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { leaveEvent } from "@/app/actions";
import { AddPaymentDialog } from "@/components/event/add-payment-dialog";
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
import { formatCurrency } from "@/lib/format";
import type { SettlementTransfer } from "@/types";

export function LeaveEventSection() {
  const router = useRouter();
  const { eventId, eventName, isOwner, currentMemberId, debt } = useEvent();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const pending = useMemo(() => {
    if (!currentMemberId || !debt) {
      return {
        hasPending: false,
        balance: 0,
        transfers: [] as SettlementTransfer[],
      };
    }

    const balance =
      debt.balances.find((b) => b.memberId === currentMemberId)?.balance ?? 0;
    const transfers = debt.transfers.filter(
      (t) =>
        t.fromMemberId === currentMemberId ||
        t.toMemberId === currentMemberId,
    );

    return {
      hasPending: Math.abs(balance) >= 0.005 || transfers.length > 0,
      balance,
      transfers,
    };
  }, [currentMemberId, debt]);

  if (isOwner) return null;

  const handleLeaveClick = () => {
    if (pending.hasPending) {
      setPendingOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const handleLeave = () => {
    startTransition(async () => {
      const res = await leaveEvent(eventId);
      if (res.error) {
        toast.error(res.error);
        if (
          res.error.includes("gastos") ||
          res.error.includes("pagos") ||
          res.error.includes("movimientos")
        ) {
          setConfirmOpen(false);
          setPendingOpen(true);
        }
        return;
      }
      toast.success("Saliste de la juntada");
      setConfirmOpen(false);
      router.push("/");
      router.refresh();
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="text-foreground w-full"
        onClick={handleLeaveClick}
      >
        <LogOut className="size-4" />
        Abandonar juntada
      </Button>

      <Dialog open={pendingOpen} onOpenChange={setPendingOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tenés cuentas pendientes</DialogTitle>
            <DialogDescription>
              Antes de abandonar &quot;{eventName}&quot;, saldá lo que debés o
              marcá como pagado lo que ya transferiste.
            </DialogDescription>
          </DialogHeader>

          {Math.abs(pending.balance) >= 0.005 && (
            <p className="text-sm font-semibold">
              {pending.balance > 0
                ? `Te deben ${formatCurrency(pending.balance)}`
                : `Debés ${formatCurrency(-pending.balance)}`}
            </p>
          )}

          {pending.transfers.length > 0 && (
            <ul className="space-y-2">
              {pending.transfers.map((t, i) => (
                <li
                  key={`${t.fromMemberId}-${t.toMemberId}-${i}`}
                  className="border-border flex items-center gap-2 rounded-xl border px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {t.fromName}
                  </span>
                  <ArrowRight className="text-muted-foreground size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {t.toName}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatCurrency(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full"
              onClick={() => {
                setPendingOpen(false);
                router.push(`/${eventId}/saldar`);
              }}
            >
              Ir a saldar
            </Button>

            {pending.transfers[0] && (
              <AddPaymentDialog
                defaultFrom={pending.transfers[0].fromMemberId}
                defaultTo={pending.transfers[0].toMemberId}
                defaultAmount={pending.transfers[0].amount}
                trigger={
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setPendingOpen(false)}
                  >
                    Marcar como pagado
                  </Button>
                }
              />
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setPendingOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Abandonar juntada?</DialogTitle>
            <DialogDescription>
              Vas a dejar de ver &quot;{eventName}&quot; y sus movimientos. Podés
              volver a sumarte solo con una nueva invitación.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={isPending}
              onClick={handleLeave}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Sí, abandonar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
