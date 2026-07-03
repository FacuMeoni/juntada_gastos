import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, PartyPopper, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppContainer } from "@/components/layout/app-container";
import { UserAvatar } from "@/components/user-avatar";
import { CreateEventDialog } from "@/components/home/create-event-dialog";
import { PendingInvitations } from "@/components/home/pending-invitations";
import { ThemeToggle } from "@/components/theme-toggle";
import { SummaryCard } from "@/components/summary-card";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { Event, EventInvitation } from "@/types";

interface EventCard extends Event {
  membersCount: number;
  total: number;
}

async function getHomeData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, alias_cvu, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("event_members")
    .select("id, status, created_at, invited_by, event:events(id, name, created_by, created_at)")
    .eq("user_id", user.id);

  const allMemberships = memberships ?? [];
  const activeMemberships = allMemberships.filter(
    (m) => m.status === "active" || !m.status,
  );
  const pendingMemberships = allMemberships.filter((m) => m.status === "pending");

  const events =
    (activeMemberships
      .map((m) => m.event)
      .filter(Boolean)
      .flat() as Event[]) ?? [];

  const inviterIds = [
    ...new Set(
      pendingMemberships.map((m) => m.invited_by).filter(Boolean) as string[],
    ),
  ];
  const inviterNames = new Map<string, string>();
  if (inviterIds.length > 0) {
    const { data: inviters } = await supabase
      .from("users")
      .select("id, name")
      .in("id", inviterIds);
    for (const u of inviters ?? []) inviterNames.set(u.id, u.name);
  }

  const invitations: EventInvitation[] = pendingMemberships
    .map((m) => {
      const rawEvent = m.event;
      const ev = (Array.isArray(rawEvent) ? rawEvent[0] : rawEvent) as
        | Event
        | null;
      if (!ev) return null;
      return {
        membershipId: m.id,
        eventId: ev.id,
        eventName: ev.name,
        invitedByName: m.invited_by
          ? (inviterNames.get(m.invited_by) ?? null)
          : null,
        createdAt: m.created_at,
      };
    })
    .filter(Boolean) as EventInvitation[];

  invitations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const eventIds = events.map((e) => e.id);

  let totalSpent = 0;
  const cards: EventCard[] = [];

  if (eventIds.length > 0) {
    const [{ data: allMembers }, { data: allExpenses }] = await Promise.all([
      supabase.from("event_members").select("event_id").in("event_id", eventIds),
      supabase.from("expenses").select("event_id, amount").in("event_id", eventIds),
    ]);

    const membersByEvent = new Map<string, number>();
    for (const m of allMembers ?? [])
      membersByEvent.set(m.event_id, (membersByEvent.get(m.event_id) ?? 0) + 1);

    const totalByEvent = new Map<string, number>();
    for (const e of allExpenses ?? []) {
      totalByEvent.set(e.event_id, (totalByEvent.get(e.event_id) ?? 0) + Number(e.amount));
      totalSpent += Number(e.amount);
    }

    for (const ev of events) {
      cards.push({
        ...ev,
        membersCount: membersByEvent.get(ev.id) ?? 0,
        total: totalByEvent.get(ev.id) ?? 0,
      });
    }

    cards.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  return {
    profile: profile ?? {
      id: user.id,
      name: user.email ?? "Vos",
      alias_cvu: null,
      avatar_url: null,
    },
    cards,
    invitations,
    totalSpent,
  };
}

export default async function HomePage() {
  const data = await getHomeData();
  if (!data) redirect("/login");

  const { profile, cards, invitations, totalSpent } = data;

  return (
    <AppContainer className="gap-5 p-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-muted-foreground text-sm">Hola,</p>
          <h1 className="text-xl font-bold tracking-tight">{profile.name}</h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/perfil"
            aria-label="Ir a mi perfil"
            className="rounded-full ring-offset-2 transition focus-visible:ring-2"
          >
            <UserAvatar
              name={profile.name}
              avatarUrl={profile.avatar_url}
              size="lg"
            />
          </Link>
        </div>
      </header>

      <SummaryCard
        icon={<Wallet className="size-6" />}
        primary={{
          label: "Gastado en todas tus juntadas",
          value: formatCurrency(totalSpent),
        }}
      />

      <PendingInvitations invitations={invitations} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Tus juntadas</h2>
          {cards.length > 0 && <CreateEventDialog />}
        </div>

        {cards.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-2.5">
            {cards.map((ev) => (
              <li key={ev.id}>
                <Link href={`/${ev.id}`}>
                  <Card className="transition active:scale-[0.99]">
                    <CardContent className="flex items-center gap-3">
                      <div className="icon-surface text-foreground flex size-10 items-center justify-center rounded-xl">
                        <PartyPopper className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{ev.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {ev.membersCount}{" "}
                          {ev.membersCount === 1 ? "persona" : "personas"} ·{" "}
                          {formatCurrency(ev.total)}
                        </p>
                      </div>
                      <ChevronRight className="text-muted-foreground size-5 shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppContainer>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="bg-muted flex size-14 items-center justify-center rounded-2xl">
          <PartyPopper className="text-muted-foreground size-7" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Todavía no tenés juntadas</p>
          <p className="text-muted-foreground text-sm text-balance">
            Creá tu primera juntada para empezar a dividir gastos.
          </p>
        </div>
        <CreateEventDialog variant="inline" />
      </CardContent>
    </Card>
  );
}
