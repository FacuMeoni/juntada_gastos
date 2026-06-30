"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateDebt } from "@/lib/debt";
import type {
  DebtCalculation,
  Expense,
  Member,
  Payment,
} from "@/types";

interface UseDebtCalculationResult {
  data: DebtCalculation | null;
  members: Member[];
  expenses: Expense[];
  payments: Payment[];
  loading: boolean;
  error: string | null;
  /** Recalcula trayendo los datos frescos de Supabase. */
  refetch: () => Promise<void>;
}

/**
 * Trae miembros, gastos (con su reparto) y pagos de un evento, y devuelve
 * el cálculo de saldos + transferencias mínimas para saldar las cuentas.
 *
 * Funciona igual para usuarios reales e invitados gestionados porque todo se
 * referencia por `event_members.id`.
 */
export function useDebtCalculation(
  eventId: string | undefined,
): UseDebtCalculationResult {
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [data, setData] = useState<DebtCalculation | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(eventId));
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const [membersRes, expensesRes, paymentsRes] = await Promise.all([
        supabase
          .from("event_members")
          .select(
            "id, event_id, user_id, guest_name, created_at, user:users(id, name, avatar_url, alias_cvu)",
          )
          .eq("event_id", eventId)
          .order("created_at", { ascending: true }),
        supabase
          .from("expenses")
          .select(
            "id, event_id, paid_by, created_by, description, amount, created_at, splits:expense_splits(id, expense_id, member_id, amount)",
          )
          .eq("event_id", eventId)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("id, event_id, from_member, to_member, amount, created_at")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false }),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const nextMembers = (membersRes.data ?? []) as unknown as Member[];
      const nextExpenses = (expensesRes.data ?? []) as unknown as Expense[];
      const nextPayments = (paymentsRes.data ?? []) as unknown as Payment[];

      setMembers(nextMembers);
      setExpenses(nextExpenses);
      setPayments(nextPayments);
      setData(calculateDebt(nextMembers, nextExpenses, nextPayments));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al calcular las deudas";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    // Carga inicial y recarga al cambiar de evento. El setState síncrono de
    // `loading` dentro de `fetchAll` es intencional para este patrón de fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll();
  }, [fetchAll]);

  return {
    data,
    members,
    expenses,
    payments,
    loading,
    error,
    refetch: fetchAll,
  };
}
