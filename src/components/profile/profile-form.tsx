"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { signOut, updateProfile } from "@/app/actions";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { customAvatarUrl } from "@/lib/avatar";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileForm({
  userId,
  initialName,
  initialAlias,
  initialAvatarUrl,
  email,
}: {
  userId: string;
  initialName: string;
  initialAlias: string;
  initialAvatarUrl: string | null;
  email: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialName);
  const [alias, setAlias] = useState(initialAlias);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    customAvatarUrl(initialAvatarUrl),
  );
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error("No se pudo subir la imagen: " + error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile({
        name,
        alias_cvu: alias,
        avatar_url: avatarUrl,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Perfil actualizado");
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSave} className="space-y-5">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative"
          aria-label="Cambiar foto de perfil"
        >
          <UserAvatar
            name={name || "?"}
            avatarUrl={avatarUrl}
            size="lg"
            className="size-20"
          />
          <span className="bg-primary text-primary-foreground absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full ring-2 ring-background">
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Camera className="size-3.5" />
            )}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <p className="text-muted-foreground text-xs">{email}</p>
        {customAvatarUrl(avatarUrl) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-auto py-1 text-xs"
            onClick={() => setAvatarUrl(null)}
          >
            Quitar foto
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="alias">Alias / CVU</Label>
            <Input
              id="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: juan.mp o 0000003100..."
            />
            <p className="text-muted-foreground text-xs">
              Para que tus amigos puedan transferirte al saldar cuentas.
            </p>
          </div>
        </CardContent>
      </Card>

        <Button type="submit" className="w-full" disabled={isPending || uploading}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Guardar cambios
        </Button>
      </form>

      <section className="space-y-2">
        <Label>Contraseña</Label>
        <ChangePasswordForm />
      </section>

      <Button
        type="button"
        variant="ghost"
        className="text-foreground w-full"
        onClick={() => startTransition(async () => void (await signOut()))}
      >
        <LogOut className="size-4" />
        Cerrar sesión
      </Button>
    </div>
  );
}
