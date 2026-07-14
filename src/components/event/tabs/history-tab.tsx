"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeftRight, Pencil, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteExpense, deletePayment } from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import { EditExpenseDialog } from "@/components/event/edit-expense-dialog";
import { EditPaymentDialog } from "@/components/event/edit-payment-dialog";
import { EventStateGuard } from "@/components/event/event-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { memberDisplayName } from "@/lib/debt";
import { canManageExpense } from "@/lib/expense";
import { canManagePayment } from "@/lib/payment";
import { formatCurrency, formatTime } from "@/lib/format";

type TimelineItem = {
  id: string;
  kind: "expense" | "payment";
  title: string;
  subtitle: string;
  amount: number;
  createdAt: string;
};

export function HistoryTab() {
  const { members, expenses, payments } = useEvent();

  const nameOf = (memberId: string) => {
    const m = members.find((x) => x.id === memberId);
    return m ? memberDisplayName(m) : "Alguien";
  };

  const items = useMemo<TimelineItem[]>(() => {
    const expenseItems: TimelineItem[] = expenses.map((e) => ({
      id: e.id,
      kind: "expense",
      title: e.description,
      subtitle: `Pagó ${nameOf(e.paid_by)}`,
      amount: e.amount,
      createdAt: e.created_at,
    }));

    const paymentItems: TimelineItem[] = payments.map((p) => ({
      id: p.id,
      kind: "payment",
      title: "Pago",
      subtitle: `${nameOf(p.from_member)} → ${nameOf(p.to_member)}`,
      amount: p.amount,
      createdAt: p.created_at,
    }));

    return [...expenseItems, ...paymentItems].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, payments, members]);

  return (
    <EventStateGuard>
      {items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          Sin movimientos todavía.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <HistoryRow key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </ul>
      )}
    </EventStateGuard>
  );
}

function HistoryRow({ item }: { item: TimelineItem }) {
  const { eventId, expenses, payments, currentMemberId, isOwner, refetch } =
    useEvent();
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const expense =
    item.kind === "expense" ? expenses.find((e) => e.id === item.id) : null;
  const payment =
    item.kind === "payment" ? payments.find((p) => p.id === item.id) : null;

  const canManage = expense
    ? canManageExpense(expense, currentMemberId, isOwner)
    : payment
      ? canManagePayment(payment, currentMemberId, isOwner)
      : false;

  const handleDelete = () => {
    startTransition(async () => {
      const res =
        item.kind === "expense"
          ? await deleteExpense(eventId, item.id)
          : await deletePayment(eventId, item.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Eliminado");
      await refetch();
    });
  };

  const isPayment = item.kind === "payment";

  return (
    <>
      <li>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="icon-surface text-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
              {isPayment ? (
                <ArrowLeftRight className="size-5" />
              ) : (
                <Receipt className="size-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-baseline gap-1.5">
                <span className="min-w-0 truncate font-medium leading-tight">
                  {item.title}
                </span>
                <span
                  className="text-muted-foreground/50 shrink-0 text-[10px] leading-none"
                  aria-hidden
                >
                  •
                </span>
                <span className="shrink-0 font-semibold tabular-nums leading-tight">
                  {formatCurrency(item.amount)}
                </span>
              </div>
              <div className="text-muted-foreground mt-1 flex min-w-0 items-center gap-1.5 text-xs leading-tight">
                <span className="min-w-0 truncate">{item.subtitle}</span>
                <span
                  className="text-muted-foreground/50 shrink-0 text-[10px] leading-none"
                  aria-hidden
                >
                  •
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatTime(item.createdAt)}
                </span>
              </div>
            </div>

            {canManage && (
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setEditOpen(true)}
                  disabled={isPending}
                  aria-label="Editar"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleDelete}
                  disabled={isPending}
                  aria-label="Eliminar"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </li>

      {expense && (
        <EditExpenseDialog
          expense={expense}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
      {payment && (
        <EditPaymentDialog
          payment={payment}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}
