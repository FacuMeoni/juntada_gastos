"use client";

import { createContext, useContext, useMemo } from "react";
import { useDebtCalculation } from "@/hooks/use-debt-calculation";
import type { EventData } from "@/lib/event-data";
import type { DebtCalculation, Expense, Member, Payment } from "@/types";

interface EventContextValue {
  eventId: string;
  eventName: string;
  isOwner: boolean;
  createdByUserId: string;
  currentUserId: string;
  /** event_members.id del usuario logueado dentro de este evento (si existe). */
  currentMemberId: string | null;
  members: Member[];
  expenses: Expense[];
  payments: Payment[];
  debt: DebtCalculation | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EventContext = createContext<EventContextValue | null>(null);

export function useEvent(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvent debe usarse dentro de <EventProvider>");
  return ctx;
}

export function EventProvider({
  eventId,
  eventName,
  isOwner,
  createdByUserId,
  currentUserId,
  initialData,
  children,
}: {
  eventId: string;
  eventName: string;
  isOwner: boolean;
  createdByUserId: string;
  currentUserId: string;
  /** Datos precargados en el servidor para evitar el fetch inicial. */
  initialData?: EventData;
  children: React.ReactNode;
}) {
  const { data, members, expenses, payments, loading, error, refetch } =
    useDebtCalculation(eventId, initialData);

  const currentMemberId = useMemo(
    () => members.find((m) => m.user_id === currentUserId)?.id ?? null,
    [members, currentUserId],
  );

  const value = useMemo<EventContextValue>(
    () => ({
      eventId,
      eventName,
      isOwner,
      createdByUserId,
      currentUserId,
      currentMemberId,
      members,
      expenses,
      payments,
      debt: data,
      loading,
      error,
      refetch,
    }),
    [
      eventId,
      eventName,
      isOwner,
      createdByUserId,
      currentUserId,
      currentMemberId,
      members,
      expenses,
      payments,
      data,
      loading,
      error,
      refetch,
    ],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}
