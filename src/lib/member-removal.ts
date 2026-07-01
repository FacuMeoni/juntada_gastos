import type { Expense, Payment } from "@/types";

export function memberRemovalStats(
  memberId: string,
  expenses: Expense[],
  payments: Payment[],
) {
  const paidExpenseCount = expenses.filter((e) => e.paid_by === memberId).length;
  const paymentCount = payments.filter(
    (p) => p.from_member === memberId || p.to_member === memberId,
  ).length;
  const splitCount = expenses.reduce(
    (total, expense) =>
      total +
      (expense.splits?.filter((split) => split.member_id === memberId).length ??
        0),
    0,
  );

  return { paidExpenseCount, paymentCount, splitCount };
}
