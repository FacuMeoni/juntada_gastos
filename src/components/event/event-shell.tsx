"use client";

import { AppContainer } from "@/components/layout/app-container";
import { EventProvider } from "@/components/event/event-context";
import { EventHeader } from "@/components/event/event-header";
import { EventTabs } from "@/components/event/event-tabs";
import type { EventData } from "@/lib/event-data";

export function EventShell({
  eventId,
  eventName,
  isOwner,
  createdByUserId,
  currentUserId,
  initialData,
  children,
}: {
  eventId: string;
  eventName: string;
  isOwner: boolean;
  createdByUserId: string;
  currentUserId: string;
  initialData?: EventData;
  children: React.ReactNode;
}) {
  return (
    <EventProvider
      eventId={eventId}
      eventName={eventName}
      isOwner={isOwner}
      createdByUserId={createdByUserId}
      currentUserId={currentUserId}
      initialData={initialData}
    >
      <AppContainer className="min-h-0 h-dvh max-h-dvh">
        <div className="bg-card border-border shrink-0 border-b">
          <EventHeader />
          <EventTabs eventId={eventId} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">{children}</div>
      </AppContainer>
    </EventProvider>
  );
}
