import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureEventMember } from "@/lib/join-event";

/**
 * Flujo de invitación.
 * - Sin sesión  -> redirige a /login conservando el destino.
 * - Con sesión  -> inserta al usuario como miembro real y entra a la juntada.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${eventId}`)}`);
  }

  const res = await ensureEventMember(supabase, user.id, eventId);
  if (res.error) {
    redirect("/?error=invite");
  }

  redirect(`/${eventId}`);
}
