"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateExpense } from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import { memberDisplayName, splitEvenlyUnits } from "@/lib/debt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types";

export function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
}: {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { eventId, members, refetch } = useEvent();

  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [paidBy, setPaidBy] = useState(expense.paid_by);
  const [participants, setParticipants] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setPaidBy(expense.paid_by);
    const splits = expense.splits ?? [];
    setParticipants(
      splits.length > 0
        ? new Set(splits.map((s) => s.member_id))
        : new Set(members.map((m) => m.id)),
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (next) resetForm();
    onOpenChange(next);
  };

  const toggleParticipant = (id: string) => {
    setParticipants((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!(value > 0)) {
      toast.error("Ingresá un monto válido.");
      return;
    }
    const selected = members.filter((m) => participants.has(m.id));
    if (selected.length === 0) {
      toast.error("Elegí al menos un participante.");
      return;
    }

    const splits =
      selected.length === members.length
        ? undefined
        : splitEvenlyUnits(
            value,
            selected.map((m) => m.id),
          );

    startTransition(async () => {
      const res = await updateExpense({
        eventId,
        expenseId: expense.id,
        description,
        amount: value,
        paidBy,
        splits,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Gasto actualizado");
      handleOpenChange(false);
      await refetch();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Editar gasto</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Descripción</Label>
            <Input
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-amount">Monto</Label>
            <Input
              id="edit-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-paidby">¿Quién pagó?</Label>
            <select
              id="edit-paidby"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
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
            <Label>Dividir entre</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const active = participants.has(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleParticipant(m.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                      active
                        ? "border-foreground bg-muted text-foreground"
                        : "border-input text-muted-foreground",
                    )}
                  >
                    {active && <Check className="size-3.5" />}
                    {memberDisplayName(m)}
                  </button>
                );
              })}
            </div>
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
