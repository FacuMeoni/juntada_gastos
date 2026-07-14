"use client";

import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { addExpense } from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import { memberDisplayName, splitEvenlyUnits } from "@/lib/debt";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetAmountInput,
  BottomSheetContent,
  BottomSheetField,
  BottomSheetForm,
  BottomSheetInput,
  BottomSheetPill,
  BottomSheetPrimaryButton,
  BottomSheetSectionLabel,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet";

export function AddExpenseDialog() {
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
    });
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetTrigger
        render={
          <Button className="h-12 w-full gap-2 rounded-xl text-sm font-medium">
            <Plus className="size-4" />
            Agregar gasto
          </Button>
        }
      />
      <BottomSheetContent className="bg-card">
        <BottomSheetForm onSubmit={handleSubmit}>
          <BottomSheetTitle>Nuevo gasto</BottomSheetTitle>

          <BottomSheetAmountInput
            id="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="$ 0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />

          <BottomSheetField label="Descripción">
            <BottomSheetInput
              id="desc"
              placeholder="Ej: Super, nafta, entradas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </BottomSheetField>

          <div className="space-y-2.5">
            <BottomSheetSectionLabel>¿Quién pagó?</BottomSheetSectionLabel>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <BottomSheetPill
                  key={m.id}
                  active={paidBy === m.id}
                  onClick={() => setPaidBy(m.id)}
                >
                  {memberDisplayName(m)}
                </BottomSheetPill>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <BottomSheetSectionLabel>Dividir entre</BottomSheetSectionLabel>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const active = participants.has(m.id);
                return (
                  <BottomSheetPill
                    key={m.id}
                    active={active}
                    onClick={() => toggleParticipant(m.id)}
                  >
                    {active && <Check className="size-3.5" />}
                    {memberDisplayName(m)}
                  </BottomSheetPill>
                );
              })}
            </div>
          </div>

          <BottomSheetPrimaryButton type="submit" loading={isPending}>
            Guardar gasto
          </BottomSheetPrimaryButton>
        </BottomSheetForm>
      </BottomSheetContent>
    </BottomSheet>
  );
}
