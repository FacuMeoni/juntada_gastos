import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { joinEvent } from "@/app/actions";

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

  const res = await joinEvent(eventId);
  if (res.error) {
    // Si el evento no existe o no se pudo unir, lo mandamos al inicio.
    redirect("/?error=invite");
  }

  redirect(`/${eventId}`);
}
