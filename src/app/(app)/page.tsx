import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppContainer } from "@/components/layout/app-container";
import { ThemeToggle } from "@/components/theme-toggle";
import { PwaInstallDialog } from "@/components/home/pwa-install-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { HomeEventsSection } from "@/components/home/home-events-section";
import { PendingInvitations } from "@/components/home/pending-invitations";
import { SummaryCard } from "@/components/summary-card";
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
    email: user.email ?? "",
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
    <AppContainer className="gap-4 p-4">
      <header className="flex items-center gap-3 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
        <Link
          href="/perfil"
          className="relative inline-flex shrink-0"
          aria-label="Ir a mi perfil y ajustes"
        >
          <UserAvatar
            name={profile.name}
            avatarUrl={profile.avatar_url}
            size="lg"
          />
          <span
            className="bg-primary text-primary-foreground pointer-events-none absolute -right-0.5 -bottom-0.5 z-10 flex size-[18px] items-center justify-center rounded-full ring-2 ring-background"
            aria-hidden
          >
            <Settings className="size-2.5" strokeWidth={2.5} />
          </span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-sm">Hola,</p>
          <h1 className="truncate text-xl font-bold tracking-tight">
            {profile.name}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PwaInstallDialog />
          <ThemeToggle className="bg-card size-10 shrink-0 rounded-xl border border-border shadow-none" />
        </div>
      </header>

      <SummaryCard
        icon={<Wallet className="size-[22px]" />}
        primary={{
          label: "Gastado en todas tus juntadas",
          value: formatCurrency(totalSpent),
        }}
      />

      <PendingInvitations invitations={invitations} />

      <HomeEventsSection cards={cards} />
    </AppContainer>
  );
}
