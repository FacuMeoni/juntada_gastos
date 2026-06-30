"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteExpense } from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import { EditExpenseDialog } from "@/components/event/edit-expense-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { memberDisplayName } from "@/lib/debt";
import { canManageExpense } from "@/lib/expense";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Expense, Member } from "@/types";

export function ExpenseDetailDialog({
  expense,
  open,
  onOpenChange,
}: {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { eventId, members, currentMemberId, refetch } = useEvent();
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const memberOf = (memberId: string | null | undefined) =>
    memberId ? members.find((m) => m.id === memberId) : undefined;

  const payer = memberOf(expense.paid_by);
  const creator = memberOf(expense.created_by);
  const canManage = canManageExpense(expense, currentMemberId);

  const splitMembers = getSplitSummary(expense, members);

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteExpense(eventId, expense.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Gasto eliminado");
      onOpenChange(false);
      await refetch();
      router.refresh();
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-left">{expense.description}</DialogTitle>
          </DialogHeader>

          <p className="text-3xl font-bold tabular-nums">
            {formatCurrency(expense.amount)}
          </p>

          <div className="space-y-3 text-sm">
            <DetailRow label="Pagó">
              <MemberChip member={payer} />
            </DetailRow>
            <DetailRow label="Cargado por">
              {creator ? (
                <MemberChip member={creator} />
              ) : (
                <span className="text-muted-foreground">No registrado</span>
              )}
            </DetailRow>
            <DetailRow label="Fecha">
              <span>{formatDateTime(expense.created_at)}</span>
            </DetailRow>
            <DetailRow label="Dividido entre">
              <span className="text-right text-balance">{splitMembers}</span>
            </DetailRow>
          </div>

          {canManage && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditOpen(true)}
                  disabled={isPending}
                >
                  <Pencil className="size-4" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Eliminar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <EditExpenseDialog
        expense={expense}
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next);
          if (!next) onOpenChange(false);
        }}
      />
    </>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

function MemberChip({ member }: { member: Member | undefined }) {
  if (!member) return <span className="text-muted-foreground">—</span>;
  const name = memberDisplayName(member);
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <UserAvatar
        name={name}
        avatarUrl={member.user?.avatar_url}
        size="sm"
      />
      <span className="font-medium">{name}</span>
    </span>
  );
}

function getSplitSummary(expense: Expense, members: Member[]): string {
  const splits = expense.splits ?? [];
  if (splits.length === 0) {
    if (members.length === 0) return "—";
    return `Todos (${members.length})`;
  }
  return splits
    .map((s) => {
      const m = members.find((x) => x.id === s.member_id);
      const name = m ? memberDisplayName(m) : "Alguien";
      return `${name} (${formatCurrency(s.amount)})`;
    })
    .join(", ");
}
