"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addPayment } from "@/app/actions";
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
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddPaymentDialog({
  trigger,
  defaultFrom,
  defaultTo,
  defaultAmount,
}: {
  trigger: React.ReactElement;
  defaultFrom?: string;
  defaultTo?: string;
  defaultAmount?: number;
}) {
  const router = useRouter();
  const { eventId, members, currentMemberId, refetch } = useEvent();

  const [open, setOpen] = useState(false);
  const [fromMember, setFromMember] = useState("");
  const [toMember, setToMember] = useState("");
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setFromMember(defaultFrom ?? currentMemberId ?? members[0]?.id ?? "");
    setToMember(defaultTo ?? members[1]?.id ?? members[0]?.id ?? "");
    setAmount(defaultAmount ? String(defaultAmount) : "");
  };

  const onOpenChange = (next: boolean) => {
    if (next) reset();
    setOpen(next);
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
      const res = await addPayment({
        eventId,
        fromMember,
        toMember,
        amount: value,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Pago registrado");
      setOpen(false);
      await refetch();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              Cuando alguien paga (total o parcial), se descuenta de su deuda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="pay-from">Paga</Label>
            <select
              id="pay-from"
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
            <Label htmlFor="pay-to">Recibe</Label>
            <select
              id="pay-to"
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
            <Label htmlFor="pay-amount">Monto</Label>
            <Input
              id="pay-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Guardar pago
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
