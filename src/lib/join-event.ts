import type { SupabaseClient } from "@supabase/supabase-js";

/** Inserta al usuario como miembro activo del evento (idempotente). */
export async function ensureEventMember(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("event_members")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "pending") {
      const { error } = await supabase
        .from("event_members")
        .update({ status: "active" })
        .eq("id", existing.id);
      if (error) return { error: error.message };
    }
    return {};
  }

  const { error } = await supabase.from("event_members").insert({
    event_id: eventId,
    user_id: userId,
    status: "active",
  });

  if (error) return { error: error.message };
  return {};
}
