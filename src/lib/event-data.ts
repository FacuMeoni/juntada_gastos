import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, Member, Payment } from "@/types";

/**
 * Consultas compartidas entre el server (layout) y el cliente
 * (`useDebtCalculation`) para poder precargar el evento en el servidor y
 * evitar el "flash" de loading al entrar a una juntada.
 */

export interface EventData {
  members: Member[];
  expenses: Expense[];
  payments: Payment[];
}

const MEMBERS_SELECT =
  "id, event_id, user_id, guest_name, status, invited_by, created_at, user:users!user_id(id, name, avatar_url, alias_cvu)";
const EXPENSES_SELECT =
  "id, event_id, paid_by, created_by, description, amount, created_at, splits:expense_splits(id, expense_id, member_id, amount)";
const PAYMENTS_SELECT =
  "id, event_id, from_member, to_member, amount, created_at, created_by";

export async function fetchEventData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  eventId: string,
): Promise<EventData> {
  const [membersRes, expensesRes, paymentsRes] = await Promise.all([
    supabase
      .from("event_members")
      .select(MEMBERS_SELECT)
      .eq("event_id", eventId)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
    supabase
      .from("expenses")
      .select(EXPENSES_SELECT)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select(PAYMENTS_SELECT)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
  ]);

  if (membersRes.error) throw membersRes.error;
  if (expensesRes.error) throw expensesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  return {
    members: (membersRes.data ?? []) as unknown as Member[],
    expenses: (expensesRes.data ?? []) as unknown as Expense[],
    payments: (paymentsRes.data ?? []) as unknown as Payment[],
  };
}
