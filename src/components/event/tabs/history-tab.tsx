"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteExpense, deletePayment } from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import { EventStateGuard } from "@/components/event/event-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { memberDisplayName } from "@/lib/debt";
import { canManageExpense } from "@/lib/expense";
import { formatCurrency } from "@/lib/format";

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
  const router = useRouter();
  const { eventId, expenses, currentMemberId, refetch } = useEvent();
  const [isPending, startTransition] = useTransition();

  const expense =
    item.kind === "expense" ? expenses.find((e) => e.id === item.id) : null;
  const canDelete =
    item.kind === "payment" ||
    (expense ? canManageExpense(expense, currentMemberId) : false);

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
      router.refresh();
    });
  };

  const isPayment = item.kind === "payment";

  return (
    <li>
      <Card>
        <CardContent className="flex items-center gap-3">
          <div
            className={
              isPayment
                ? "icon-surface text-foreground flex size-10 items-center justify-center rounded-xl"
                : "bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-xl"
            }
          >
            {isPayment ? (
              <ArrowLeftRight className="size-5" />
            ) : (
              <Receipt className="size-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{item.title}</p>
            <p className="text-muted-foreground truncate text-xs">
              {item.subtitle}
            </p>
          </div>
          <p className="font-semibold">{formatCurrency(item.amount)}</p>
          {canDelete && (
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
          )}
        </CardContent>
      </Card>
    </li>
  );
}
