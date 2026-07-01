import type { SupabaseClient } from "@supabase/supabase-js";

/** Inserta al usuario como miembro del evento si aún no lo es (idempotente). */
export async function ensureEventMember(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("event_members")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return {};

  const { error } = await supabase
    .from("event_members")
    .insert({ event_id: eventId, user_id: userId });

  if (error) return { error: error.message };
  return {};
}
