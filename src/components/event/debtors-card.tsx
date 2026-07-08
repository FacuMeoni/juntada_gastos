"use client";

import Link from "next/link";
import { useEvent } from "@/components/event/event-context";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { MemberBalance } from "@/types";

const MAX_DEBTORS = 3;

/** Top deudores del evento (balance negativo), ordenados por monto adeudado. */
export function DebtorsCard() {
  const { eventId, debt } = useEvent();

  const debtors = (debt?.balances ?? [])
    .filter((b) => b.balance < -0.005)
    .sort((a, b) => a.balance - b.balance)
    .slice(0, MAX_DEBTORS);

  if (debtors.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-[13px] font-medium">
          Pendiente de saldar
        </h2>
        <Link
          href={`/${eventId}/saldar`}
          className="text-muted-foreground hover:text-foreground text-[11px] transition-colors"
        >
          Ver todo ›
        </Link>
      </div>
      <Card>
        <CardContent className="space-y-3 p-3.5">
          {debtors.map((d) => (
            <DebtorRow key={d.memberId} debtor={d} />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function DebtorRow({ debtor }: { debtor: MemberBalance }) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar
        name={debtor.name}
        avatarUrl={debtor.avatarUrl}
        size="sm"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {debtor.name}
      </span>
      <span className="text-sm font-bold tabular-nums">
        {formatCurrency(-debtor.balance)}
      </span>
    </div>
  );
}
