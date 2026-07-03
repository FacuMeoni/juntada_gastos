"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { leaveEvent } from "@/app/actions";
import { useEvent } from "@/components/event/event-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LeaveEventSection() {
  const router = useRouter();
  const { eventId, eventName, isOwner } = useEvent();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (isOwner) return null;

  const handleLeave = () => {
    startTransition(async () => {
      const res = await leaveEvent(eventId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Saliste de la juntada");
      setOpen(false);
      router.push("/");
      router.refresh();
    });
  };

  return (
    <section className="space-y-2">
      <Label>Mi participación</Label>
      <Card>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm text-balance">
            Si no querés seguir en &quot;{eventName}&quot;, podés abandonar la
            juntada. No podés salir si tenés gastos o pagos pendientes.
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button type="button" variant="outline" className="w-full">
                  <LogOut className="size-4" />
                  Abandonar juntada
                </Button>
              }
            />
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>¿Abandonar juntada?</DialogTitle>
                <DialogDescription>
                  Vas a dejar de ver &quot;{eventName}&quot; y sus movimientos.
                  Podés volver a sumarte solo con una nueva invitación.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={isPending}
                  onClick={handleLeave}
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  Sí, abandonar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </section>
  );
}
