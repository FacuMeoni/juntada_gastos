"use client";

import { useMemo, useState } from "react";
import { Receipt, Wallet } from "lucide-react";
import { useEvent } from "@/components/event/event-context";
import { AddExpenseDialog } from "@/components/event/add-expense-dialog";
import { DebtorsCard } from "@/components/event/debtors-card";
import { ExpenseDetailDialog } from "@/components/event/expense-detail-dialog";
import { EventStateGuard } from "@/components/event/event-state";
import { SummaryCard } from "@/components/summary-card";
import { Card, CardContent } from "@/components/ui/card";
import { memberDisplayName } from "@/lib/debt";
import { formatCurrency } from "@/lib/format";
import type { Expense } from "@/types";

function myBalanceSummary(
  balance: number,
): { label: string; value: string; settled: boolean } {
  if (Math.abs(balance) < 0.005) {
    return { label: "Tu saldo", value: "Al día", settled: true };
  }
  if (balance > 0) {
    return {
      label: "Te deben",
      value: formatCurrency(balance),
      settled: false,
    };
  }
  return {
    label: "Debés",
    value: formatCurrency(-balance),
    settled: false,
  };
}

export function ExpensesTab() {
  const { expenses, debt, currentMemberId } = useEvent();

  const myBalance =
    debt?.balances.find((b) => b.memberId === currentMemberId)?.balance ?? 0;
  const summary = myBalanceSummary(myBalance);

  return (
    <EventStateGuard>
      <div className="flex flex-col gap-4 pb-2">
        <SummaryCard
          icon={<Wallet className="size-6" />}
          primary={{
            label: "Total gastado",
            value: formatCurrency(debt?.totalSpent ?? 0),
          }}
          secondary={{
            label: summary.label,
            value: summary.value,
            muted: summary.settled,
          }}
        />

        <AddExpenseDialog />

        {expenses.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Todavía no hay gastos. ¡Agregá el primero!
          </p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((e) => (
              <ExpenseRow key={e.id} expense={e} />
            ))}
          </ul>
        )}

        <DebtorsCard />
      </div>
    </EventStateGuard>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const { members } = useEvent();
  const [detailOpen, setDetailOpen] = useState(false);

  const payerName = useMemo(() => {
    const m = members.find((x) => x.id === expense.paid_by);
    return m ? memberDisplayName(m) : "Alguien";
  }, [members, expense.paid_by]);

  return (
    <>
      <li>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/30"
          onClick={() => setDetailOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setDetailOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <CardContent className="flex items-center gap-3">
            <div className="icon-surface text-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Receipt className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{expense.description}</p>
              <p className="text-muted-foreground text-xs">Pagó {payerName}</p>
            </div>
            <p className="shrink-0 font-semibold tabular-nums">
              {formatCurrency(expense.amount)}
            </p>
          </CardContent>
        </Card>
      </li>

      <ExpenseDetailDialog
        expense={expense}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
