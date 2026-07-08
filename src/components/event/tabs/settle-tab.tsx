"use client";

import {
  ArrowRight,
  CheckCircle2,
  PartyPopper,
  Plus,
} from "lucide-react";
import { useEvent } from "@/components/event/event-context";
import { customAvatarUrl } from "@/lib/avatar";
import { EventStateGuard } from "@/components/event/event-state";
import { AddPaymentDialog } from "@/components/event/add-payment-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SettlementTransfer } from "@/types";

export function SettleTab() {
  const { debt, members } = useEvent();
  const suggestedTransfer = debt?.transfers[0];

  const aliasOf = (memberId: string) =>
    members.find((m) => m.id === memberId)?.user?.alias_cvu ?? null;
  const avatarOf = (memberId: string) => {
    const m = members.find((x) => x.id === memberId);
    if (!m) return null;
    return customAvatarUrl(m.user?.avatar_url ?? null);
  };

  return (
    <EventStateGuard>
      <div className="space-y-5">
        <section className="space-y-2">
          <h2 className="text-muted-foreground text-sm font-medium">Saldos</h2>
          <ul className="space-y-2">
            {(debt?.balances ?? []).map((b) => {
              const settled = Math.abs(b.balance) < 0.005;
              return (
                <li key={b.memberId}>
                  <Card>
                    <CardContent className="flex items-center gap-3">
                      <UserAvatar name={b.name} avatarUrl={b.avatarUrl} />
                      <span className="flex-1 truncate font-medium">
                        {b.name}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          settled
                            ? "text-muted-foreground"
                            :                           b.balance > 0
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {settled
                          ? "Al día"
                          : b.balance > 0
                            ? `Le deben ${formatCurrency(b.balance)}`
                            : `Debe ${formatCurrency(-b.balance)}`}
                      </span>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-muted-foreground text-sm font-medium">
              Cómo saldar
            </h2>
            <AddPaymentDialog
              defaultFrom={suggestedTransfer?.fromMemberId}
              defaultTo={suggestedTransfer?.toMemberId}
              defaultAmount={suggestedTransfer?.amount}
              trigger={
                <Button variant="ghost" size="sm">
                  <Plus className="size-4" />
                  Registrar pago
                </Button>
              }
            />
          </div>
          {(debt?.transfers.length ?? 0) === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                <PartyPopper className="text-foreground size-7" />
                <p className="font-medium">¡Cuentas saldadas!</p>
                <p className="text-muted-foreground text-sm">
                  No hay deudas pendientes en esta juntada.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {debt!.transfers.map((t, i) => (
                <TransferRow
                  key={`${t.fromMemberId}-${t.toMemberId}-${i}`}
                  transfer={t}
                  alias={aliasOf(t.toMemberId)}
                  fromAvatar={avatarOf(t.fromMemberId)}
                  toAvatar={avatarOf(t.toMemberId)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </EventStateGuard>
  );
}

function TransferRow({
  transfer,
  alias,
  fromAvatar,
  toAvatar,
}: {
  transfer: SettlementTransfer;
  alias: string | null;
  fromAvatar: string | null;
  toAvatar: string | null;
}) {
  return (
    <li>
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <UserAvatar name={transfer.fromName} avatarUrl={fromAvatar} size="sm" />
            <span className="truncate text-sm font-medium">
              {transfer.fromName}
            </span>
            <ArrowRight className="text-muted-foreground size-4 shrink-0" />
            <UserAvatar name={transfer.toName} avatarUrl={toAvatar} size="sm" />
            <span className="truncate text-sm font-medium">
              {transfer.toName}
            </span>
            <span className="ml-auto font-semibold">
              {formatCurrency(transfer.amount)}
            </span>
          </div>

          {alias && (
            <p className="text-muted-foreground text-xs">
              Transferir a:{" "}
              <span className="text-foreground font-medium">{alias}</span>
            </p>
          )}

          <AddPaymentDialog
            defaultFrom={transfer.fromMemberId}
            defaultTo={transfer.toMemberId}
            defaultAmount={transfer.amount}
            trigger={
              <Button variant="outline" size="sm" className="w-full">
                <CheckCircle2 className="size-4" />
                Marcar como pagado
              </Button>
            }
          />
        </CardContent>
      </Card>
    </li>
  );
}
