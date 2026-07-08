"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureEventMember } from "@/lib/join-event";
import { createClient } from "@/lib/supabase/server";
import type { FrequentContact } from "@/types";

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

/** Dueño, creador, pagador o participante explícito del gasto. */
async function assertCanManageExpense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  expenseId: string,
): Promise<ActionResult | null> {
  const { data: expense } = await supabase
    .from("expenses")
    .select(
      "created_by, event_id, paid_by, events!inner(created_by), expense_splits(member_id)",
    )
    .eq("id", expenseId)
    .single();

  if (!expense) return { error: "Gasto no encontrado." };

  const eventOwnerId = (
    expense.events as { created_by: string } | { created_by: string }[]
  );
  const ownerId = Array.isArray(eventOwnerId)
    ? eventOwnerId[0]?.created_by
    : eventOwnerId.created_by;

  if (ownerId === userId) return null;

  const { data: member } = await supabase
    .from("event_members")
    .select("id")
    .eq("event_id", expense.event_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member) return { error: "No tenés permiso para modificar este gasto." };

  const splits = (expense.expense_splits ?? []) as { member_id: string }[];
  const allowed =
    expense.created_by === member.id ||
    expense.paid_by === member.id ||
    splits.some((s) => s.member_id === member.id);

  if (!allowed) {
    return { error: "No tenés permiso para modificar este gasto." };
  }

  return null;
}

/** Dueño, quien lo registró o participante del pago (from/to). */
async function assertCanManagePayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  paymentId: string,
): Promise<ActionResult | null> {
  const { data: payment } = await supabase
    .from("payments")
    .select(
      "created_by, event_id, from_member, to_member, events!inner(created_by)",
    )
    .eq("id", paymentId)
    .single();

  if (!payment) return { error: "Pago no encontrado." };

  const eventOwnerId = (
    payment.events as { created_by: string } | { created_by: string }[]
  );
  const ownerId = Array.isArray(eventOwnerId)
    ? eventOwnerId[0]?.created_by
    : eventOwnerId.created_by;

  if (ownerId === userId) return null;

  const { data: member } = await supabase
    .from("event_members")
    .select("id")
    .eq("event_id", payment.event_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member) return { error: "No tenés permiso para modificar este pago." };

  const allowed =
    payment.created_by === member.id ||
    payment.from_member === member.id ||
    payment.to_member === member.id;

  if (!allowed) {
    return { error: "No tenés permiso para modificar este pago." };
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

export async function getFrequentContacts(): Promise<
  ActionResult<FrequentContact[]>
> {
  const { supabase, user } = await requireUser();

  const { data: myMemberships, error: membershipsError } = await supabase
    .from("event_members")
    .select("event_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (membershipsError) return { error: membershipsError.message };

  const eventIds = (myMemberships ?? []).map((m) => m.event_id);
  if (eventIds.length === 0) return { data: [] };

  const { data: coMembers, error: coMembersError } = await supabase
    .from("event_members")
    .select("user_id, event_id, user:users!user_id(id, name, avatar_url)")
    .in("event_id", eventIds)
    .eq("status", "active")
    .not("user_id", "is", null)
    .neq("user_id", user.id);

  if (coMembersError) return { error: coMembersError.message };

  const byUser = new Map<
    string,
    { name: string; avatarUrl: string | null; eventIds: Set<string> }
  >();

  for (const row of coMembers ?? []) {
    if (!row.user_id) continue;
    const rawUser = row.user;
    const profile = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as {
      id: string;
      name: string;
      avatar_url: string | null;
    } | null;

    const existing = byUser.get(row.user_id);
    if (existing) {
      existing.eventIds.add(row.event_id);
      continue;
    }

    byUser.set(row.user_id, {
      name: profile?.name?.trim() || "Usuario",
      avatarUrl: profile?.avatar_url ?? null,
      eventIds: new Set([row.event_id]),
    });
  }

  const contacts: FrequentContact[] = Array.from(byUser.entries())
    .map(([userId, info]) => ({
      userId,
      name: info.name,
      avatarUrl: info.avatarUrl,
      sharedEventsCount: info.eventIds.size,
    }))
    .sort((a, b) => b.sharedEventsCount - a.sharedEventsCount);

  return { data: contacts };
}

export async function createEvent(input: {
  name: string;
  memberUserIds?: string[];
}): Promise<ActionResult<string>> {
  const { supabase, user } = await requireUser();

  const cleanName = input.name.trim();
  if (!cleanName) return { error: "Poné un nombre para la juntada." };

  const { data: event, error } = await supabase
    .from("events")
    .insert({ name: cleanName, created_by: user.id })
    .select("id")
    .single();

  if (error || !event) return { error: error?.message ?? "No se pudo crear." };

  const { error: memberError } = await supabase
    .from("event_members")
    .insert({ event_id: event.id, user_id: user.id, status: "active" });

  if (memberError) return { error: memberError.message };

  const extraUserIds = [
    ...new Set((input.memberUserIds ?? []).filter((id) => id !== user.id)),
  ];

  if (extraUserIds.length > 0) {
    const { error: inviteError } = await supabase.from("event_members").insert(
      extraUserIds.map((userId) => ({
        event_id: event.id,
        user_id: userId,
        status: "pending",
        invited_by: user.id,
      })),
    );

    if (inviteError) return { error: inviteError.message };
  }

  revalidatePath("/");
  revalidatePath(`/${event.id}`);
  return { data: event.id };
}

export async function inviteMembersToEvent(input: {
  eventId: string;
  memberUserIds: string[];
}): Promise<ActionResult<{ invited: number }>> {
  const { supabase, user } = await requireUser();

  const { data: membership } = await supabase
    .from("event_members")
    .select("id")
    .eq("event_id", input.eventId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    return { error: "Tenés que ser miembro activo para invitar amigos." };
  }

  const uniqueIds = [
    ...new Set(input.memberUserIds.filter((id) => id !== user.id)),
  ];

  if (uniqueIds.length === 0) {
    return { error: "Elegí al menos un amigo para invitar." };
  }

  const { data: existing } = await supabase
    .from("event_members")
    .select("user_id")
    .eq("event_id", input.eventId)
    .in("user_id", uniqueIds);

  const alreadyIn = new Set(
    (existing ?? []).map((row) => row.user_id).filter(Boolean) as string[],
  );
  const toInvite = uniqueIds.filter((id) => !alreadyIn.has(id));

  if (toInvite.length === 0) {
    return { error: "Esas personas ya están en la juntada o tienen invitación." };
  }

  const { error } = await supabase.from("event_members").insert(
    toInvite.map((userId) => ({
      event_id: input.eventId,
      user_id: userId,
      status: "pending" as const,
      invited_by: user.id,
    })),
  );

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/${input.eventId}`);
  revalidatePath(`/${input.eventId}/ajustes`);
  return { data: { invited: toInvite.length } };
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

export async function acceptEventInvitation(
  eventId: string,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const { data: membership } = await supabase
    .from("event_members")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!membership) return { error: "No tenés una invitación pendiente." };

  const { error } = await supabase
    .from("event_members")
    .update({ status: "active" })
    .eq("id", membership.id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/${eventId}`);
  return {};
}

export async function declineEventInvitation(
  eventId: string,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("event_members")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) return { error: error.message };
  revalidatePath("/");
  return {};
}

export async function leaveEvent(eventId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const { data: event } = await supabase
    .from("events")
    .select("created_by")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return { error: "Juntada no encontrada." };
  if (event.created_by === user.id) {
    return { error: "El organizador no puede abandonar la juntada. Eliminala desde ajustes." };
  }

  const { data: member } = await supabase
    .from("event_members")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member) return { error: "No sos miembro activo de esta juntada." };

  const memberId = member.id;

  const [{ count: paidCount }, { count: splitCount }, { count: paymentCount }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("paid_by", memberId),
      supabase
        .from("expense_splits")
        .select("id", { count: "exact", head: true })
        .eq("member_id", memberId),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .or(`from_member.eq.${memberId},to_member.eq.${memberId}`),
    ]);

  if ((paidCount ?? 0) > 0 || (splitCount ?? 0) > 0 || (paymentCount ?? 0) > 0) {
    return {
      error:
        "No podés salir mientras tengas gastos o pagos registrados. Pedile al organizador que resuelva tus movimientos.",
    };
  }

  const { error } = await supabase
    .from("event_members")
    .delete()
    .eq("id", memberId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/${eventId}`);
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

  const denied = await assertCanManageExpense(
    supabase,
    user.id,
    input.expenseId,
  );
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

  const denied = await assertCanManageExpense(supabase, user.id, expenseId);
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
  const { supabase, user } = await requireUser();

  if (!(input.amount > 0)) return { error: "El monto debe ser mayor a 0." };
  if (input.fromMember === input.toMember)
    return { error: "El pagador y el receptor deben ser distintos." };

  const { data: myMember } = await supabase
    .from("event_members")
    .select("id")
    .eq("event_id", input.eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("payments").insert({
    event_id: input.eventId,
    from_member: input.fromMember,
    to_member: input.toMember,
    amount: input.amount,
    created_by: myMember?.id ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/${input.eventId}`);
  return {};
}

export async function updatePayment(input: {
  eventId: string;
  paymentId: string;
  fromMember: string;
  toMember: string;
  amount: number;
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  if (!(input.amount > 0)) return { error: "El monto debe ser mayor a 0." };
  if (input.fromMember === input.toMember)
    return { error: "El pagador y el receptor deben ser distintos." };

  const denied = await assertCanManagePayment(
    supabase,
    user.id,
    input.paymentId,
  );
  if (denied) return denied;

  const { error } = await supabase
    .from("payments")
    .update({
      from_member: input.fromMember,
      to_member: input.toMember,
      amount: input.amount,
    })
    .eq("id", input.paymentId);

  if (error) return { error: error.message };
  revalidatePath(`/${input.eventId}`);
  return {};
}

export async function deletePayment(
  eventId: string,
  paymentId: string,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const denied = await assertCanManagePayment(supabase, user.id, paymentId);
  if (denied) return denied;

  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) return { error: error.message };
  revalidatePath(`/${eventId}`);
  return {};
}
