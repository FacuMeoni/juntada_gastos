"use client";

import { useState } from "react";
import { Check, Copy, Users } from "lucide-react";
import { toast } from "sonner";
import { useEvent } from "@/components/event/event-context";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { memberDisplayName } from "@/lib/debt";
import type { Member } from "@/types";

export function EventMembersDialog() {
  const { members } = useEvent();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground h-8 shrink-0 gap-1.5 px-2 tabular-nums"
        aria-label={`${members.length} participantes. Ver listado`}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Users className="size-4" aria-hidden />
        <span>{members.length}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Participantes ({members.length})</DialogTitle>
          </DialogHeader>
          <ul className="max-h-[min(60vh,24rem)] space-y-2 overflow-y-auto overscroll-y-contain">
            {members.map((member) => (
              <MemberListItem key={member.id} member={member} />
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MemberListItem({ member }: { member: Member }) {
  const [copied, setCopied] = useState(false);
  const isGuest = member.user_id === null;
  const name = memberDisplayName(member);
  const alias = member.user?.alias_cvu?.trim() || null;

  const copyAlias = async () => {
    if (!alias) return;
    try {
      await navigator.clipboard.writeText(alias);
      setCopied(true);
      toast.success("Alias copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el alias");
    }
  };

  return (
    <li className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
      <UserAvatar
        name={name}
        avatarUrl={member.user?.avatar_url}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {alias ? (
          <button
            type="button"
            onClick={copyAlias}
            className="text-muted-foreground hover:text-foreground mt-0.5 flex max-w-full items-center gap-1.5 text-left text-xs transition"
            aria-label={`Copiar alias de ${name}`}
          >
            <span className="truncate">{alias}</span>
            {copied ? (
              <Check className="text-foreground size-3.5 shrink-0" />
            ) : (
              <Copy className="size-3.5 shrink-0 opacity-60" />
            )}
          </button>
        ) : null}
      </div>
      <Badge variant={isGuest ? "secondary" : "outline"} className="shrink-0">
        {isGuest ? "Gestionado" : "Con cuenta"}
      </Badge>
    </li>
  );
}
