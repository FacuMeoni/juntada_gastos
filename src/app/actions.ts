"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureEventMember } from "@/lib/join-event";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult<T = undefined> {
  error?: string;
  data?: T;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Solo quien cargó el gasto puede modificarlo o borrarlo. */
async function assertExpenseCreator(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  expenseId: string,
): Promise<ActionResult | null> {
  const { data: expense } = await supabase
    .from("expenses")
    .select("created_by, event_id")
    .eq("id", expenseId)
    .single();

  if (!expense?.created_by) {
    return { error: "Este gasto no se puede editar (registro anterior)." };
  }

  const { data: member } = await supabase
    .from("event_members")
    .select("id")
    .eq("event_id", expense.event_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (member?.id !== expense.created_by) {
    return { error: "Solo quien cargó el gasto puede modificarlo." };
  }

  return null;
}

// -----------------------------------------------------------------------------
// Auth / Perfil
// -----------------------------------------------------------------------------

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfile(input: {
  name: string;
  alias_cvu: string | null;
  avatar_url: string | null;
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const name = input.name.trim();
  if (!name) return { error: "El nombre no puede estar vacío." };

  const { error } = await supabase
    .from("users")
    .update({
      name,
      alias_cvu: input.alias_cvu?.trim() || null,
      avatar_url: input.avatar_url || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/perfil");
  revalidatePath("/");
  return {};
}

// -----------------------------------------------------------------------------
// Eventos
// -----------------------------------------------------------------------------

export async function createEvent(name: string): Promise<ActionResult<string>> {
  const { supabase, user } = await requireUser();

  const cleanName = name.trim();
  if (!cleanName) return { error: "Poné un nombre para la juntada." };

  const { data: event, error } = await supabase
    .from("events")
    .insert({ name: cleanName, created_by: user.id })
    .select("id")
    .single();

  if (error || !event) return { error: error?.message ?? "No se pudo crear." };

  // El creador se une automáticamente como participante real.
  const { error: memberError } = await supabase
    .from("event_members")
    .insert({ event_id: event.id, user_id: user.id });

  if (memberError) return { error: memberError.message };

  revalidatePath("/");
  return { data: event.id };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) return { error: error.message };
  revalidatePath("/");
  return {};
}

export async function addManagedMember(
  eventId: string,
  guestName: string,
): Promise<ActionResult> {
  const { supabase } = await requireUser();

  const name = guestName.trim();
  if (!name) return { error: "Ingresá un nombre." };

  const { error } = await supabase
    .from("event_members")
    .insert({ event_id: eventId, user_id: null, guest_name: name });

  if (error) return { error: error.message };
  revalidatePath(`/${eventId}`);
  return {};
}

export async function removeManagedMember(input: {
  eventId: string;
  memberId: string;
  /** Borra los gastos que pagó el participante, o los reasigna a otro miembro. */
  strategy: "delete_expenses" | "reassign_expenses";
  reassignToMemberId?: string;
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", input.eventId)
    .eq("created_by", user.id)
    .maybeSingle();

  if (!event) {
    return { error: "Solo el creador de la juntada puede eliminar participantes." };
  }

  const { data: member } = await supabase
    .from("event_members")
    .select("id, user_id")
    .eq("id", input.memberId)
    .eq("event_id", input.eventId)
    .maybeSingle();

  if (!member) return { error: "Participante no encontrado." };
  if (member.user_id) {
    return { error: "Solo podés eliminar participantes gestionados sin cuenta." };
  }

  if (input.strategy === "reassign_expenses") {
    if (!input.reassignToMemberId) {
      return { error: "Elegí a quién reasignar los gastos." };
    }
    if (input.reassignToMemberId === input.memberId) {
      return { error: "Elegí un participante distinto." };
    }

    const { data: target } = await supabase
      .from("event_members")
      .select("id")
      .eq("id", input.reassignToMemberId)
      .eq("event_id", input.eventId)
      .maybeSingle();

    if (!target) return { error: "El participante destino no pertenece a la juntada." };
  }

  const { error: paymentsError } = await supabase
    .from("payments")
    .delete()
    .eq("event_id", input.eventId)
    .or(
      `from_member.eq.${input.memberId},to_member.eq.${input.memberId}`,
    );

  if (paymentsError) return { error: paymentsError.message };

  const { error: splitsError } = await supabase
    .from("expense_splits")
    .delete()
    .eq("member_id", input.memberId);

  if (splitsError) return { error: splitsError.message };

  if (input.strategy === "delete_expenses") {
    const { error: expensesError } = await supabase
      .from("expenses")
      .delete()
      .eq("event_id", input.eventId)
      .eq("paid_by", input.memberId);

    if (expensesError) return { error: expensesError.message };
  } else {
    const { error: reassignError } = await supabase
      .from("expenses")
      .update({ paid_by: input.reassignToMemberId! })
      .eq("event_id", input.eventId)
      .eq("paid_by", input.memberId);

    if (reassignError) return { error: reassignError.message };
  }

  const { error: memberError } = await supabase
    .from("event_members")
    .delete()
    .eq("id", input.memberId);

  if (memberError) return { error: memberError.message };

  revalidatePath(`/${input.eventId}`);
  return {};
}

/** Une al usuario logueado a un evento (desde formularios / client actions). */
export async function joinEvent(eventId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const res = await ensureEventMember(supabase, user.id, eventId);
  if (res.error) return { error: res.error };
  revalidatePath(`/${eventId}`);
  revalidatePath("/");
  return {};
}

// -----------------------------------------------------------------------------
// Gastos y pagos
// -----------------------------------------------------------------------------

export async function addExpense(input: {
  eventId: string;
  description: string;
  amount: number;
  paidBy: string;
  /** Si se omite, se divide en partes iguales entre todos los miembros. */
  splits?: { memberId: string; amount: number }[];
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const description = input.description.trim();
  if (!description) return { error: "Agregá una descripción." };
  if (!(input.amount > 0)) return { error: "El monto debe ser mayor a 0." };
  if (!input.paidBy) return { error: "Indicá quién pagó." };

  const { data: myMember } = await supabase
    .from("event_members")
    .select("id")
    .eq("event_id", input.eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      event_id: input.eventId,
      paid_by: input.paidBy,
      created_by: myMember?.id ?? null,
      description,
      amount: input.amount,
    })
    .select("id")
    .single();

  if (error || !expense) return { error: error?.message ?? "No se pudo guardar." };

  if (input.splits && input.splits.length > 0) {
    const rows = input.splits
      .filter((s) => s.amount > 0)
      .map((s) => ({
        expense_id: expense.id,
        member_id: s.memberId,
        amount: s.amount,
      }));

    if (rows.length > 0) {
      const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(rows);
      if (splitError) return { error: splitError.message };
    }
  }

  revalidatePath(`/${input.eventId}`);
  return {};
}

export async function updateExpense(input: {
  eventId: string;
  expenseId: string;
  description: string;
  amount: number;
  paidBy: string;
  splits?: { memberId: string; amount: number }[];
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const description = input.description.trim();
  if (!description) return { error: "Agregá una descripción." };
  if (!(input.amount > 0)) return { error: "El monto debe ser mayor a 0." };
  if (!input.paidBy) return { error: "Indicá quién pagó." };

  const denied = await assertExpenseCreator(supabase, user.id, input.expenseId);
  if (denied) return denied;

  const { error } = await supabase
    .from("expenses")
    .update({
      description,
      amount: input.amount,
      paid_by: input.paidBy,
    })
    .eq("id", input.expenseId);

  if (error) return { error: error.message };

  const { error: deleteSplitsError } = await supabase
    .from("expense_splits")
    .delete()
    .eq("expense_id", input.expenseId);

  if (deleteSplitsError) return { error: deleteSplitsError.message };

  if (input.splits && input.splits.length > 0) {
    const rows = input.splits
      .filter((s) => s.amount > 0)
      .map((s) => ({
        expense_id: input.expenseId,
        member_id: s.memberId,
        amount: s.amount,
      }));

    if (rows.length > 0) {
      const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(rows);
      if (splitError) return { error: splitError.message };
    }
  }

  revalidatePath(`/${input.eventId}`);
  return {};
}

export async function deleteExpense(
  eventId: string,
  expenseId: string,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const denied = await assertExpenseCreator(supabase, user.id, expenseId);
  if (denied) return denied;

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) return { error: error.message };
  revalidatePath(`/${eventId}`);
  return {};
}

export async function addPayment(input: {
  eventId: string;
  fromMember: string;
  toMember: string;
  amount: number;
}): Promise<ActionResult> {
  const { supabase } = await requireUser();

  if (!(input.amount > 0)) return { error: "El monto debe ser mayor a 0." };
  if (input.fromMember === input.toMember)
    return { error: "El pagador y el receptor deben ser distintos." };

  const { error } = await supabase.from("payments").insert({
    event_id: input.eventId,
    from_member: input.fromMember,
    to_member: input.toMember,
    amount: input.amount,
  });

  if (error) return { error: error.message };
  revalidatePath(`/${input.eventId}`);
  return {};
}

export async function deletePayment(
  eventId: string,
  paymentId: string,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) return { error: error.message };
  revalidatePath(`/${eventId}`);
  return {};
}
