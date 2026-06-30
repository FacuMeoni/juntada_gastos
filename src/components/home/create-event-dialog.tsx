"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createEvent } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function CreateEventDialog({
  variant = "default",
}: {
  variant?: "default" | "inline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createEvent(name);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setOpen(false);
      setName("");
      toast.success("¡Juntada creada!");
      if (res.data) router.push(`/${res.data}`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          variant === "inline" ? (
            <Button>
              <Plus className="size-4" />
              Nueva juntada
            </Button>
          ) : (
            <Button size="icon" aria-label="Nueva juntada">
              <Plus className="size-5" />
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva juntada</DialogTitle>
            <DialogDescription>
              Un viaje, un asado, un cumple... ponele un nombre.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-4">
            <Label htmlFor="event-name">Nombre</Label>
            <Input
              id="event-name"
              placeholder="Ej: Viaje a Bariloche"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Crear juntada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
