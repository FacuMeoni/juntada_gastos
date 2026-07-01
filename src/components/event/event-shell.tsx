"use client";

import { History, Home, ArrowLeftRight, Settings } from "lucide-react";
import { AppContainer } from "@/components/layout/app-container";
import { BottomNav, type BottomNavItem } from "@/components/layout/bottom-nav";
import { EventProvider } from "@/components/event/event-context";
import { EventHeader } from "@/components/event/event-header";

export function EventShell({
  eventId,
  eventName,
  isOwner,
  currentUserId,
  children,
}: {
  eventId: string;
  eventName: string;
  isOwner: boolean;
  currentUserId: string;
  children: React.ReactNode;
}) {
  const items: BottomNavItem[] = [
    { href: `/${eventId}`, label: "Inicio", icon: Home, exact: true },
    { href: `/${eventId}/saldar`, label: "Saldar", icon: ArrowLeftRight },
    { href: `/${eventId}/historial`, label: "Historial", icon: History },
    { href: `/${eventId}/ajustes`, label: "Ajustes", icon: Settings },
  ];

  return (
    <EventProvider
      eventId={eventId}
      eventName={eventName}
      isOwner={isOwner}
      currentUserId={currentUserId}
    >
      <AppContainer withBottomNav>
        <EventHeader />

        <div className="flex min-h-0 flex-1 flex-col p-4">
          {children}
        </div>
      </AppContainer>

      <BottomNav items={items} />
    </EventProvider>
  );
}
