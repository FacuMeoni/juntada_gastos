"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type Mode = "signin" | "signup" | "magic";

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
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (authError) {
      toast.error(
        "El link de acceso es inválido o expiró. Probá con email y contraseña.",
      );
    }
  }, [authError]);

  const redirectTo = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  };

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo(),
        data: { name: name.trim() || email.split("@")[0] },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Si la confirmación de email está desactivada, ya hay sesión -> entramos.
    if (data.session) {
      toast.success("¡Cuenta creada!");
      goNext();
      return;
    }
    // Si no, hay que confirmar por correo.
    setSent(true);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  const handleGoogle = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) toast.error(error.message);
  };

  if (sent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="text-primary size-10" />
          <div>
            <p className="font-semibold">Revisá tu correo</p>
            <p className="text-muted-foreground text-sm">
              Te enviamos un correo a <strong>{email}</strong>. Abrí el link en{" "}
              <strong>este mismo navegador</strong> para continuar.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  const titles: Record<Mode, string> = {
    signin: "Iniciar sesión",
    signup: "Crear cuenta",
    magic: "Entrar con link mágico",
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {authError && (
          <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md p-3 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              El link de acceso es inválido o expiró. Probá con email y
              contraseña.
            </span>
          </div>
        )}

        <p className="text-sm font-medium">{titles[mode]}</p>

        {mode === "magic" ? (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <EmailField email={email} setEmail={setEmail} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Enviar link mágico
            </Button>
          </form>
        ) : (
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
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Lock className="size-4" />
              )}
              {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
            </Button>
          </form>
        )}

        <div className="space-y-1 text-center text-sm">
          {mode === "signin" && (
            <p className="text-muted-foreground">
              ¿No tenés cuenta?{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => setMode("signup")}
              >
                Crear una
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p className="text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => setMode("signin")}
              >
                Iniciar sesión
              </button>
            </p>
          )}
          {mode !== "magic" ? (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs hover:underline"
              onClick={() => setMode("magic")}
            >
              Prefiero entrar con un link mágico
            </button>
          ) : (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs hover:underline"
              onClick={() => setMode("signin")}
            >
              Volver a email y contraseña
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">o</span>
          <div className="bg-border h-px flex-1" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
        >
          <GoogleIcon />
          Continuar con Google
        </Button>
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
