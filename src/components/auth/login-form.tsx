"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type Mode = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const authError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authError) {
      toast.error("No se pudo iniciar sesión. Probá de nuevo.");
    }
  }, [authError]);

  const goNext = () => {
    router.push(next);
    router.refresh();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : error.message,
      );
      return;
    }
    toast.success("¡Bienvenido!");
    goNext();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() || email.split("@")[0] },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("¡Cuenta creada!");
    goNext();
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {authError && (
          <div className="bg-muted text-foreground flex items-start gap-2 rounded-md p-3 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>No se pudo iniciar sesión. Probá de nuevo.</span>
          </div>
        )}

        <p className="text-sm font-medium">
          {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
        </p>

        <form
          onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
          className="space-y-3"
        >
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <EmailField email={email} setEmail={setEmail} />
          <PasswordField
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Lock className="size-4" />
            )}
            {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
        </form>

        <div className="text-center text-sm">
          {mode === "signin" ? (
            <p className="text-muted-foreground">
              ¿No tenés cuenta?{" "}
              <button
                type="button"
                className="text-foreground font-medium hover:underline"
                onClick={() => setMode("signup")}
              >
                Crear una
              </button>
            </p>
          ) : (
            <p className="text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <button
                type="button"
                className="text-foreground font-medium hover:underline"
                onClick={() => setMode("signin")}
              >
                Iniciar sesión
              </button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmailField({
  email,
  setEmail,
}: {
  email: string;
  setEmail: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="email">Correo electrónico</Label>
      <Input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>
  );
}

function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Contraseña</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          minLength={6}
          required
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </Button>
      </div>
    </div>
  );
}
