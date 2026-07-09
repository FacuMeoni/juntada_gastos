"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Plus, Search, Share2 } from "lucide-react";
import { toast } from "sonner";
import { createEvent, getFrequentContacts } from "@/app/actions";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetField,
  BottomSheetInput,
  BottomSheetPrimaryButton,
  BottomSheetSearchInput,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet";
import { inviteUrl } from "@/lib/site-url";
import type { FrequentContact } from "@/types";
import { cn } from "@/lib/utils";

const TOP_CONTACTS = 5;

function inviteMessage(eventName: string, eventId: string) {
  return `Sumate a "${eventName}" en JuntadasApp: ${inviteUrl(eventId)}`;
}

export function CreateEventDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [name, setName] = useState("");
  const [contacts, setContacts] = useState<FrequentContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setName("");
    setContacts([]);
    setLoadingContacts(false);
    setShowAllMembers(false);
    setContactSearch("");
    setSelected(new Set());
    setCreatedEventId(null);
    setCopied(false);
  };

  const loadContacts = () => {
    setLoadingContacts(true);
    void getFrequentContacts().then((res) => {
      if (res.error) {
        toast.error(res.error);
        setContacts([]);
        setSelected(new Set());
      } else {
        setContacts(res.data ?? []);
        setSelected(new Set());
      }
      setLoadingContacts(false);
    });
  };

  const setOpen = (next: boolean) => {
    if (controlledOnOpenChange) controlledOnOpenChange(next);
    else setInternalOpen(next);
  };

  const onOpenChange = (next: boolean) => {
    if (!next) {
      reset();
    } else {
      loadContacts();
    }
    setOpen(next);
  };

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
    ? contacts.filter((c) =>
        c.name.toLowerCase().includes(normalizedSearch),
      )
    : contacts;
  const visibleContacts = isSearching
    ? filteredContacts
    : showAllMembers
      ? contacts
      : contacts.slice(0, TOP_CONTACTS);
  const hasMoreContacts = !isSearching && contacts.length > TOP_CONTACTS;

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Poné un nombre para la juntada.");
      return;
    }

    startTransition(async () => {
      const res = await createEvent({
        name: trimmed,
        memberUserIds: [...selected],
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (!res.data) return;
      setCreatedEventId(res.data);
      toast.success("¡Juntada creada!");
    });
  };

  const copyInvite = async () => {
    if (!createdEventId) return;
    try {
      await navigator.clipboard.writeText(
        inviteMessage(name.trim(), createdEventId),
      );
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  const shareInvite = async () => {
    if (!createdEventId) return;
    const trimmed = name.trim();
    const url = inviteUrl(createdEventId);
    const text = inviteMessage(trimmed, createdEventId);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: trimmed,
          text: `Sumate a "${trimmed}" en JuntadasApp`,
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

  const enterEvent = () => {
    if (!createdEventId) return;
    const eventId = createdEventId;
    setOpen(false);
    router.push(`/${eventId}`);
  };

  const selectedCount = selected.size;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <BottomSheetTrigger
          render={
            <Button
              size="icon"
              className="size-9 shrink-0 rounded-lg"
              aria-label="Nueva juntada"
            />
          }
        >
          <Plus className="size-[18px]" />
        </BottomSheetTrigger>
      ) : null}
      <BottomSheetContent className="bg-card">
        {!createdEventId ? (
          <div className="flex flex-col gap-[18px]">
            <div className="space-y-1.5">
              <BottomSheetTitle>Nueva juntada</BottomSheetTitle>
              <BottomSheetDescription>
                Poné un nombre y sumá gente con la que ya dividiste gastos.
              </BottomSheetDescription>
            </div>

            <BottomSheetField label="Nombre">
              <BottomSheetInput
                id="event-name"
                placeholder="Ej: Viaje a Bariloche"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </BottomSheetField>

            <div className="space-y-3">
              <p className="text-foreground text-[13px] font-medium">
                Sumá participantes
              </p>

              {loadingContacts ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : contacts.length === 0 ? (
                <p className="text-muted-foreground text-[13px] leading-snug">
                  Todavía no tenés juntadas con otras personas. Creá la juntada
                  y compartí el link para invitar.
                </p>
              ) : (
                <>
                  {contacts.length >= 3 && (
                    <div className="relative">
                      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <BottomSheetSearchInput
                        type="search"
                        placeholder="Buscar por nombre…"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="pl-9"
                        aria-label="Buscar participantes"
                      />
                    </div>
                  )}

                  {visibleContacts.length === 0 ? (
                    <p className="text-muted-foreground text-[13px]">
                      No encontramos a nadie con ese nombre.
                    </p>
                  ) : (
                    <ul className="max-h-[min(40vh,14rem)] space-y-1 overflow-y-auto overscroll-y-contain">
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
                        : `Ver todos los miembros (${contacts.length})`}
                    </Button>
                  )}
                </>
              )}
            </div>

            <BottomSheetPrimaryButton
              type="button"
              loading={isPending}
              disabled={loadingContacts}
              onClick={handleCreate}
            >
              Crear juntada
              {selectedCount > 0 ? ` (${selectedCount})` : ""}
            </BottomSheetPrimaryButton>
          </div>
        ) : (
          <div className="flex flex-col gap-[18px]">
            <div className="space-y-1.5">
              <BottomSheetTitle>¡Listo!</BottomSheetTitle>
              <BottomSheetDescription>
                {selectedCount > 0
                  ? `Enviaste invitación a ${selectedCount} ${selectedCount === 1 ? "persona" : "personas"}. Van a verla en su inicio y pueden aceptar o rechazar. Compartí el link con quien falte.`
                  : "Compartí el link para invitar a quien quieras."}
              </BottomSheetDescription>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-xl"
                onClick={copyInvite}
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? "¡Copiado!" : "Copiar link"}
              </Button>
              <Button
                type="button"
                className="h-12 w-full rounded-xl"
                onClick={shareInvite}
              >
                <Share2 className="size-4" />
                Compartir
              </Button>
            </div>

            <BottomSheetPrimaryButton type="button" onClick={enterEvent}>
              Continuar
            </BottomSheetPrimaryButton>
          </div>
        )}
      </BottomSheetContent>
    </BottomSheet>
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
