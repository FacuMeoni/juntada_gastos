"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  addManagedMember,
  deleteEvent,
} from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import { RemoveManagedMemberDialog } from "@/components/event/remove-managed-member-dialog";
import { EventStateGuard } from "@/components/event/event-state";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { memberDisplayName } from "@/lib/debt";
import { inviteUrl } from "@/lib/site-url";

export function SettingsTab() {
  const { eventId, members, isOwner } = useEvent();

  return (
    <EventStateGuard>
      <div className="space-y-6">
        <InviteSection eventId={eventId} />
        {isOwner && <AddMemberSection eventId={eventId} />}

        <section className="space-y-2">
          <Label>Participantes</Label>
          <ul className="space-y-2">
            {members.map((m) => (
              <MemberRow key={m.id} memberId={m.id} />
            ))}
          </ul>
        </section>

        {isOwner && <DangerZone eventId={eventId} />}
      </div>
    </EventStateGuard>
  );
}

function InviteSection({ eventId }: { eventId: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl(eventId));
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  return (
    <section className="space-y-2">
      <Label>Invitar amigos</Label>
      <Card>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Compartí este link para que se sumen con su cuenta.
          </p>
          <Button onClick={copy} className="w-full" variant="outline">
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "¡Copiado!" : "Copiar link de invitación"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function AddMemberSection({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { refetch } = useEvent();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await addManagedMember(eventId, name);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setName("");
      toast.success("Participante agregado");
      await refetch();
      router.refresh();
    });
  };

  return (
    <section className="space-y-2">
      <Label htmlFor="guest">Agregar participante gestionado</Label>
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          id="guest"
          placeholder="Nombre (ej: Tío Carlos)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" size="icon" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
        </Button>
      </form>
      <p className="text-muted-foreground text-xs">
        Para amigos sin cuenta: vos manejás sus gastos.
      </p>
    </section>
  );
}

function MemberRow({ memberId }: { memberId: string }) {
  const { members, isOwner } = useEvent();
  const [removeOpen, setRemoveOpen] = useState(false);

  const member = members.find((m) => m.id === memberId);
  if (!member) return null;

  const isGuest = member.user_id === null;
  const canRemove = isOwner && isGuest;

  return (
    <li>
      <Card>
        <CardContent className="flex items-center gap-3">
          <UserAvatar
            name={memberDisplayName(member)}
            avatarUrl={member.user?.avatar_url}
            size="sm"
          />
          <span className="flex-1 truncate text-sm font-medium">
            {memberDisplayName(member)}
          </span>
          <Badge variant={isGuest ? "secondary" : "outline"}>
            {isGuest ? "Gestionado" : "Con cuenta"}
          </Badge>
          {canRemove && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setRemoveOpen(true)}
              aria-label="Quitar participante gestionado"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      <RemoveManagedMemberDialog
        member={member}
        open={removeOpen}
        onOpenChange={setRemoveOpen}
      />
    </li>
  );
}

function DangerZone({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteEvent(eventId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Juntada eliminada");
      router.push("/");
    });
  };

  return (
    <section className="space-y-2 pt-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="destructive" className="w-full">
              <Trash2 className="size-4" />
              Eliminar juntada
            </Button>
          }
        />
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar esta juntada?</DialogTitle>
            <DialogDescription>
              Se borrarán todos los gastos, pagos y participantes. Esta acción
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
