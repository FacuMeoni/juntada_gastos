"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { addPayment } from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import { memberDisplayName } from "@/lib/debt";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetAmountInput,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetField,
  BottomSheetForm,
  BottomSheetPrimaryButton,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet";

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
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasPreset =
    defaultFrom != null &&
    defaultTo != null &&
    defaultAmount != null &&
    defaultAmount > 0;

  const reset = () => {
    setFromMember(defaultFrom ?? currentMemberId ?? members[0]?.id ?? "");
    setToMember(defaultTo ?? members[1]?.id ?? members[0]?.id ?? "");
    setAmount(
      defaultAmount != null && defaultAmount > 0 ? String(defaultAmount) : "",
    );
    setCopied(false);
  };

  const onOpenChange = (next: boolean) => {
    if (next) reset();
    setOpen(next);
  };

  const fromName = members.find((m) => m.id === fromMember);
  const toName = members.find((m) => m.id === toMember);
  const recipientAlias = toName?.user?.alias_cvu ?? null;

  const headline = (() => {
    if (!fromName || !toName) return "Marcar pago";
    if (currentMemberId === toMember) {
      return `${memberDisplayName(fromName)} te paga`;
    }
    if (currentMemberId === fromMember) {
      return `Pagás a ${memberDisplayName(toName)}`;
    }
    return `${memberDisplayName(fromName)} paga a ${memberDisplayName(toName)}`;
  })();

  const copyAlias = async () => {
    if (!recipientAlias) return;
    try {
      await navigator.clipboard.writeText(recipientAlias);
      setCopied(true);
      toast.success("Alias copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el alias");
    }
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
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetTrigger render={trigger} />
      <BottomSheetContent className="bg-card">
        {hasPreset ? (
          <BottomSheetForm onSubmit={handleSubmit}>
            <div className="space-y-3">
              <h2 className="text-lg font-bold tracking-tight">{headline}</h2>
              <BottomSheetAmountInput
                id="pay-amount-preset"
                type="number"
                min="0"
                step="0.01"
                placeholder="$ 0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {recipientAlias ? (
              <div className="space-y-2">
                <p className="text-muted-foreground text-[13px]">
                  Transferí a
                </p>
                <div className="border-border flex items-center gap-2 rounded-xl border px-3.5 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {recipientAlias}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 rounded-lg px-3 text-xs"
                    onClick={copyAlias}
                  >
                    <Copy className="size-3.5" />
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>
            ) : null}

            <BottomSheetPrimaryButton type="submit" loading={isPending}>
              Marcar como pagado
            </BottomSheetPrimaryButton>
          </BottomSheetForm>
        ) : (
          <BottomSheetForm onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <BottomSheetTitle>Marcar pago</BottomSheetTitle>
              <BottomSheetDescription>
                Cuando alguien paga (total o parcial), se descuenta de su
                deuda.
              </BottomSheetDescription>
            </div>

            <BottomSheetField label="Paga">
              <select
                id="pay-from"
                value={fromMember}
                onChange={(e) => setFromMember(e.target.value)}
                className="border-border bg-card w-full rounded-xl border px-3.5 py-3.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {memberDisplayName(m)}
                  </option>
                ))}
              </select>
            </BottomSheetField>

            <div className="text-muted-foreground flex justify-center">
              <ArrowRight className="size-4" />
            </div>

            <BottomSheetField label="Recibe">
              <select
                id="pay-to"
                value={toMember}
                onChange={(e) => setToMember(e.target.value)}
                className="border-border bg-card w-full rounded-xl border px-3.5 py-3.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {memberDisplayName(m)}
                  </option>
                ))}
              </select>
            </BottomSheetField>

            <BottomSheetField label="Monto">
              <BottomSheetAmountInput
                id="pay-amount"
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

            <BottomSheetPrimaryButton type="submit" loading={isPending}>
              Marcar como pagado
            </BottomSheetPrimaryButton>
          </BottomSheetForm>
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
}
