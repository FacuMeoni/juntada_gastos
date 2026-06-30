import type { Expense } from "@/types";

/** Solo quien cargó el gasto puede editarlo o eliminarlo. */
export function canManageExpense(
  expense: Expense,
  currentMemberId: string | null,
): boolean {
  if (!currentMemberId || !expense.created_by) return false;
  return expense.created_by === currentMemberId;
}
