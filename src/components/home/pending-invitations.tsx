"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2, PartyPopper, X } from "lucide-react";
import { toast } from "sonner";
import {
  acceptEventInvitation,
  declineEventInvitation,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EventInvitation } from "@/types";

export function PendingInvitations({
  invitations,
}: {
  invitations: EventInvitation[];
}) {
  if (invitations.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="text-foreground size-4" />
        <h2 className="font-semibold">Invitaciones</h2>
      </div>
      <ul className="space-y-2.5">
        {invitations.map((inv) => (
          <InvitationCard key={inv.membershipId} invitation={inv} />
        ))}
      </ul>
    </section>
  );
}

function InvitationCard({ invitation }: { invitation: EventInvitation }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const accept = () => {
    startTransition(async () => {
      const res = await acceptEventInvitation(invitation.eventId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`¡Te sumaste a ${invitation.eventName}!`);
      router.push(`/${invitation.eventId}`);
      router.refresh();
    });
  };

  const decline = () => {
    startTransition(async () => {
      const res = await declineEventInvitation(invitation.eventId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Invitación rechazada");
      router.refresh();
    });
  };

  return (
    <li>
      <Card className="border-foreground/20">
        <CardContent className="flex items-start gap-3">
          <div className="icon-surface text-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
            <PartyPopper className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="font-medium">{invitation.eventName}</p>
              <p className="text-muted-foreground text-xs text-balance">
                {invitation.invitedByName
                  ? `${invitation.invitedByName} te invitó a esta juntada.`
                  : "Te invitaron a esta juntada."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                disabled={isPending}
                onClick={accept}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Aceptar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={isPending}
                onClick={decline}
              >
                <X className="size-4" />
                Rechazar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
