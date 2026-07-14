"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateDebt } from "@/lib/debt";
import { fetchEventData, type EventData } from "@/lib/event-data";
import type { DebtCalculation, Expense, Member, Payment } from "@/types";

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
 *
 * Si se recibe `initialData` (precargada en el servidor), se evita el
 * fetch inicial y el skeleton de carga al entrar a la juntada.
 */
export function useDebtCalculation(
  eventId: string | undefined,
  initialData?: EventData,
): UseDebtCalculationResult {
  const [members, setMembers] = useState<Member[]>(
    initialData?.members ?? [],
  );
  const [expenses, setExpenses] = useState<Expense[]>(
    initialData?.expenses ?? [],
  );
  const [payments, setPayments] = useState<Payment[]>(
    initialData?.payments ?? [],
  );
  const [data, setData] = useState<DebtCalculation | null>(
    initialData
      ? calculateDebt(
          initialData.members,
          initialData.expenses,
          initialData.payments,
        )
      : null,
  );
  const [loading, setLoading] = useState<boolean>(
    Boolean(eventId) && !initialData,
  );
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
      const { members: nextMembers, expenses: nextExpenses, payments: nextPayments } =
        await fetchEventData(supabase, eventId);

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

  // Evita re-fetchear en el montaje inicial cuando ya llegaron datos
  // precargados desde el servidor.
  const skipInitialFetch = useRef(Boolean(initialData));

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    // Carga inicial y recarga al cambiar de evento.
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
