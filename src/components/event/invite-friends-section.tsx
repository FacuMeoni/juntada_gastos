"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Copy, Search, Share2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { inviteMembersToEvent } from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import {
  getCachedFrequentContacts,
  invalidateFrequentContactsCache,
} from "@/lib/frequent-contacts-cache";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { inviteUrl } from "@/lib/site-url";
import type { FrequentContact } from "@/types";
import { cn } from "@/lib/utils";

const TOP_CONTACTS = 5;

function inviteMessage(eventName: string, eventId: string) {
  return `Sumate a "${eventName}" en JuntadasApp: ${inviteUrl(eventId)}`;
}

export function InviteFriendsSection() {
  const { eventId, eventName, members, refetch } = useEvent();
  const [allContacts, setAllContacts] = useState<FrequentContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const memberUserIds = useMemo(
    () =>
      new Set(
        members
          .filter((m) => m.status === "active" || m.status === "pending")
          .map((m) => m.user_id)
          .filter(Boolean) as string[],
      ),
    [members],
  );

  const contacts = useMemo(
    () => allContacts.filter((c) => !memberUserIds.has(c.userId)),
    [allContacts, memberUserIds],
  );

  const allFriendsAlreadyHere =
    !loadingContacts && allContacts.length > 0 && contacts.length === 0;
  const noFriendsYet = !loadingContacts && allContacts.length === 0;

  useEffect(() => {
    let cancelled = false;

    void getCachedFrequentContacts()
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          toast.error(res.error);
          setAllContacts([]);
          return;
        }
        setAllContacts(res.data ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoadingContacts(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleContact = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const normalizedSearch = contactSearch.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;
  const filteredContacts = isSearching
    ? contacts.filter((c) => c.name.toLowerCase().includes(normalizedSearch))
    : contacts;
  const visibleContacts = isSearching
    ? filteredContacts
    : showAllMembers
      ? contacts
      : contacts.slice(0, TOP_CONTACTS);
  const hasMoreContacts = !isSearching && contacts.length > TOP_CONTACTS;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl(eventId));
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  const shareLink = async () => {
    const url = inviteUrl(eventId);
    const text = inviteMessage(eventName, eventId);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: eventName,
          text: `Sumate a "${eventName}" en JuntadasApp`,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Link copiado (compartir no disponible acá)");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo compartir ni copiar el link");
    }
  };

  const handleInvite = () => {
    if (selected.size === 0) {
      toast.error("Elegí al menos un amigo.");
      return;
    }

    startTransition(async () => {
      const res = await inviteMembersToEvent({
        eventId,
        memberUserIds: [...selected],
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.data?.invited === 1
          ? "Invitación enviada"
          : `${res.data?.invited} invitaciones enviadas`,
      );
      setSelected(new Set());
      invalidateFrequentContactsCache();
      await refetch();
    });
  };

  return (
    <section className="space-y-2">
      <Label>Invitar amigos</Label>
      <Card>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Sumá amigos con cuenta o compartí el link para que se unan.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              variant="default"
              onClick={shareLink}
            >
              <Share2 className="size-4" />
              Compartir
            </Button>
            <Button
              type="button"
              className="flex-1"
              variant="outline"
              onClick={copyLink}
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "¡Copiado!" : "Copiar link"}
            </Button>
          </div>

          {loadingContacts ? (
            <div className="space-y-2 pt-1">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : allFriendsAlreadyHere ? (
            <div className="space-y-3 border-t pt-5">
              <div className="flex items-start gap-3">
                <div className="icon-surface flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Users className="size-5" />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-sm font-semibold leading-snug">
                    ¡Ya están todos tus amigos acá!
                  </p>
                  <p className="text-muted-foreground text-[13px] leading-relaxed">
                    Todos tus contactos frecuentes ya forman parte de esta
                    juntada. Compartí el link si querés sumar a alguien más.
                  </p>
                </div>
              </div>
            </div>
          ) : noFriendsYet ? (
            <p className="text-muted-foreground text-[13px] leading-snug">
              Todavía no tenés amigos con cuenta en otras juntadas. Compartí el
              link para invitar a quien quieras.
            </p>
          ) : (
            <div className="space-y-3 border-t pt-4">
              <p className="text-foreground text-[13px] font-medium">
                Invitar de tus juntadas
              </p>

              {contacts.length >= 3 && (
                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <input
                    type="search"
                    placeholder="Buscar por nombre…"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="border-border bg-card placeholder:text-muted-foreground w-full rounded-xl border py-2.5 pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label="Buscar amigos"
                  />
                </div>
              )}

              {visibleContacts.length === 0 ? (
                <p className="text-muted-foreground text-[13px]">
                  No encontramos a nadie con ese nombre.
                </p>
              ) : (
                <ul className="max-h-[min(36vh,12rem)] space-y-1 overflow-y-auto overscroll-y-contain">
                  {visibleContacts.map((contact) => (
                    <ContactRow
                      key={contact.userId}
                      contact={contact}
                      active={selected.has(contact.userId)}
                      onToggle={() => toggleContact(contact.userId)}
                    />
                  ))}
                </ul>
              )}

              {hasMoreContacts && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-auto w-full py-1 text-xs"
                  onClick={() => setShowAllMembers((v) => !v)}
                >
                  {showAllMembers
                    ? "Ver menos"
                    : `Ver todos (${contacts.length})`}
                </Button>
              )}

              <Button
                type="button"
                className="w-full"
                disabled={isPending || selected.size === 0}
                onClick={handleInvite}
              >
                <UserPlus className="size-4" />
                Invitar
                {selected.size > 0 ? ` (${selected.size})` : ""}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ContactRow({
  contact,
  active,
  onToggle,
}: {
  contact: FrequentContact;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left transition",
          active && "bg-muted/60",
        )}
      >
        <UserAvatar
          name={contact.name}
          avatarUrl={contact.avatarUrl}
          size="sm"
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {contact.name}
        </span>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {contact.sharedEventsCount}{" "}
          {contact.sharedEventsCount === 1 ? "juntada" : "juntadas"}
        </span>
        {active && <Check className="size-4 shrink-0" aria-hidden />}
      </button>
    </li>
  );
}
