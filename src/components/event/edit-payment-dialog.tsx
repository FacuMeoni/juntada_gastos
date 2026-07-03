"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePayment } from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import { memberDisplayName } from "@/lib/debt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Payment } from "@/types";

export function EditPaymentDialog({
  payment,
  open,
  onOpenChange,
}: {
  payment: Payment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { eventId, members, refetch } = useEvent();

  const [fromMember, setFromMember] = useState(payment.from_member);
  const [toMember, setToMember] = useState(payment.to_member);
  const [amount, setAmount] = useState(String(payment.amount));
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setFromMember(payment.from_member);
    setToMember(payment.to_member);
    setAmount(String(payment.amount));
  };

  const handleOpenChange = (next: boolean) => {
    if (next) resetForm();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!(value > 0)) {
      toast.error("Ingresá un monto válido.");
      return;
    }
    if (fromMember === toMember) {
      toast.error("El pagador y quien recibe deben ser distintos.");
      return;
    }

    startTransition(async () => {
      const res = await updatePayment({
        eventId,
        paymentId: payment.id,
        fromMember,
        toMember,
        amount: value,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Pago actualizado");
      handleOpenChange(false);
      await refetch();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Editar pago</DialogTitle>
            <DialogDescription>
              Corregí quién pagó, a quién y el monto registrado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="edit-pay-from">Paga</Label>
            <select
              id="edit-pay-from"
              value={fromMember}
              onChange={(e) => setFromMember(e.target.value)}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {memberDisplayName(m)}
                </option>
              ))}
            </select>
          </div>

          <div className="text-muted-foreground flex justify-center">
            <ArrowRight className="size-4" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-pay-to">Recibe</Label>
            <select
              id="edit-pay-to"
              value={toMember}
              onChange={(e) => setToMember(e.target.value)}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {memberDisplayName(m)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-pay-amount">Monto</Label>
            <Input
              id="edit-pay-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
