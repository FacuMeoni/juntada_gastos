"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Paperclip, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { addExpense } from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import { memberDisplayName, splitEvenlyUnits } from "@/lib/debt";
import { createClient } from "@/lib/supabase/client";
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

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

export function AddExpenseDialog() {
  const { eventId, members, currentMemberId, refetch } = useEvent();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");
  const [participants, setParticipants] = useState<Set<string>>(new Set());
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const clearReceipt = () => {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const reset = () => {
    setDescription("");
    setAmount("");
    setPaidBy(currentMemberId ?? members[0]?.id ?? "");
    setParticipants(new Set(members.map((m) => m.id)));
    clearReceipt();
  };

  const onOpenChange = (next: boolean) => {
    if (next) reset();
    else clearReceipt();
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

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se admiten imágenes.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      toast.error("La imagen puede pesar hasta 5 MB.");
      e.target.value = "";
      return;
    }

    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return null;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Tenés que iniciar sesión.");

    const ext = receiptFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${eventId}/${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("expense-receipts")
      .upload(path, receiptFile, {
        upsert: false,
        contentType: receiptFile.type,
      });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage
      .from("expense-receipts")
      .getPublicUrl(path);

    return data.publicUrl;
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
      let receiptUrl: string | null = null;
      try {
        receiptUrl = await uploadReceipt();
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "No se pudo subir la foto del ticket.",
        );
        return;
      }

      const res = await addExpense({
        eventId,
        description,
        amount: value,
        paidBy,
        receiptUrl,
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
          <Button className="h-12 w-full gap-2 rounded-sm text-sm font-medium">
            <Plus className="size-4" />
            Agregar gasto
          </Button>
        }
      />
      <BottomSheetContent className="bg-card">
        <BottomSheetForm onSubmit={handleSubmit} className="gap-6">
          <BottomSheetTitle>Nuevo gasto</BottomSheetTitle>

          <BottomSheetField label="Monto">
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
          </BottomSheetField>

          <BottomSheetField label="Descripción">
            <div className="space-y-3">
              <div className="relative">
                <BottomSheetInput
                  id="desc"
                  placeholder="Ej: Super, nafta, entradas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="min-h-12 pr-12"
                />
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-sm transition-[color,scale] duration-150 ease-out active:scale-[0.96]"
                  aria-label="Adjuntar foto del ticket"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="size-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleReceiptChange}
                />
              </div>

              {receiptPreview ? (
                <div className="relative overflow-hidden rounded-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptPreview}
                    alt="Vista previa del ticket"
                    className="image-ring max-h-40 w-full rounded-sm object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    className="absolute top-2 right-2 size-8 rounded-full shadow-sm"
                    aria-label="Quitar foto"
                    onClick={clearReceipt}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-[12px] leading-snug">
                  Opcional: adjuntá una foto del ticket o comprobante.
                </p>
              )}
            </div>
          </BottomSheetField>

          <div className="space-y-3">
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

          <div className="space-y-3">
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
