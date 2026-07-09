"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, PartyPopper, Plus } from "lucide-react";
import { CreateEventDialog } from "@/components/home/create-event-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export interface HomeEventCard {
  id: string;
  name: string;
  membersCount: number;
  total: number;
}

export function HomeEventsSection({ cards }: { cards: HomeEventCard[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) router.refresh();
  };

  return (
    <>
      <CreateEventDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        showTrigger={false}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Tus juntadas</h2>
          {cards.length > 0 ? (
            <Button
              type="button"
              size="icon"
              className="size-9 shrink-0 rounded-lg"
              aria-label="Nueva juntada"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-[18px]" />
            </Button>
          ) : null}
        </div>

        {cards.length === 0 ? (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="icon-surface flex size-14 items-center justify-center rounded-2xl">
                <PartyPopper className="text-muted-foreground size-7" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Todavía no tenés juntadas</p>
                <p className="text-muted-foreground text-sm text-balance">
                  Creá tu primera juntada para empezar a dividir gastos.
                </p>
              </div>
              <Button type="button" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Nueva juntada
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {cards.map((ev) => (
              <li key={ev.id}>
                <Link href={`/${ev.id}`} className="block">
                  <Card className="transition-colors hover:bg-muted/40 active:scale-[0.99]">
                    <CardContent className="flex items-center gap-3 p-4">
                      <ChevronRight className="text-muted-foreground size-5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">
                          {ev.name}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs leading-none">
                          {ev.membersCount}{" "}
                          {ev.membersCount === 1 ? "persona" : "personas"} ·{" "}
                          {formatCurrency(ev.total)}
                        </p>
                      </div>
                      <div className="icon-surface flex size-10 shrink-0 items-center justify-center rounded-xl">
                        <PartyPopper className="size-5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
