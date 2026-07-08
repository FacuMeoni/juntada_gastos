import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventShell } from "@/components/event/event-shell";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // RLS sólo deja ver el evento si el usuario es miembro o dueño.
  const { data: event } = await supabase
    .from("events")
    .select("id, name, created_by")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const isOwner = event.created_by === user.id;

  if (!isOwner) {
    const { data: membership } = await supabase
      .from("event_members")
      .select("status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || membership.status !== "active") {
      notFound();
    }
  }
  return (
    <EventShell
      eventId={event.id}
      eventName={event.name}
      isOwner={isOwner}
      createdByUserId={event.created_by}
      currentUserId={user.id}
    >
      {children}
    </EventShell>
  );
}
