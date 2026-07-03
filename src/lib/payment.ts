import type { Payment } from "@/types";

/** Dueño, quien lo registró o alguno de los participantes del pago. */
export function canManagePayment(
  payment: Payment,
  currentMemberId: string | null,
  isOwner: boolean,
): boolean {
  if (isOwner) return true;
  if (!currentMemberId) return false;
  if (payment.created_by === currentMemberId) return true;
  if (payment.from_member === currentMemberId) return true;
  if (payment.to_member === currentMemberId) return true;
  return false;
}
