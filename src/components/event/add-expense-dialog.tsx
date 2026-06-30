"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { addExpense } from "@/app/actions";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AddExpenseDialog() {
  const router = useRouter();
  const { eventId, members, currentMemberId, refetch } = useEvent();

  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");
  const [participants, setParticipants] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setDescription("");
    setAmount("");
    setPaidBy(currentMemberId ?? members[0]?.id ?? "");
    setParticipants(new Set(members.map((m) => m.id)));
  };

  const onOpenChange = (next: boolean) => {
    if (next) reset();
    setOpen(next);
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

    // Si participan todos, dejamos que se divida en partes iguales (sin splits).
    const splits =
      selected.length === members.length
        ? undefined
        : splitEvenlyUnits(
            value,
            selected.map((m) => m.id),
          );

    startTransition(async () => {
      const res = await addExpense({
        eventId,
        description,
        amount: value,
        paidBy,
        splits,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Gasto agregado");
      setOpen(false);
      await refetch();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button className="w-full">
            <Plus className="size-4" />
            Agregar gasto
          </Button>
        }
      />
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nuevo gasto</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Descripción</Label>
            <Input
              id="desc"
              placeholder="Ej: Super, nafta, entradas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paidby">¿Quién pagó?</Label>
            <select
              id="paidby"
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
                        ? "border-primary bg-primary/10 text-primary"
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
            Guardar gasto
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
