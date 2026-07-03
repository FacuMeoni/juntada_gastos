import type { Expense } from "@/types";

/**
 * Dueño de la juntada, quien cargó el gasto, quien pagó o participante
 * explícito en el reparto.
 */
export function canManageExpense(
  expense: Expense,
  currentMemberId: string | null,
  isOwner: boolean,
): boolean {
  if (isOwner) return true;
  if (!currentMemberId) return false;
  if (expense.created_by === currentMemberId) return true;
  if (expense.paid_by === currentMemberId) return true;

  const splits = expense.splits ?? [];
  if (splits.some((s) => s.member_id === currentMemberId)) return true;

  return false;
}
