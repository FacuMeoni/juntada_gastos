"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl } from "@/lib/site-url";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type Mode = "signin" | "signup" | "recovery";

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
  const [recoverySent, setRecoverySent] = useState(false);

  useEffect(() => {
    if (authError) {
      toast.error("No se pudo iniciar sesión. Probá de nuevo.");
    }
  }, [authError]);

  const goNext = () => {
    router.replace(next);
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
    if (error) {
      setLoading(false);
      toast.error(
        error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : error.message,
      );
      return;
    }
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
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    goNext();
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authCallbackUrl("/restablecer-contrasena"),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRecoverySent(true);
    toast.success("Te enviamos un link para restablecer la contraseña.");
  };

  if (recoverySent && mode === "recovery") {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6 text-center">
          <div className="bg-muted mx-auto flex size-12 items-center justify-center rounded-full">
            <Mail className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Revisá tu correo</p>
            <p className="text-muted-foreground text-sm text-balance">
              Si existe una cuenta con <strong>{email}</strong>, vas a recibir
              un link para elegir una contraseña nueva.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setRecoverySent(false);
              setMode("signin");
            }}
          >
            Volver al inicio de sesión
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {authError && mode !== "recovery" && (
          <div className="bg-muted text-foreground flex items-start gap-2 rounded-md p-3 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>No se pudo iniciar sesión. Probá de nuevo.</span>
          </div>
        )}

        <p className="text-sm font-medium">
          {mode === "signin"
            ? "Iniciar sesión"
            : mode === "signup"
              ? "Crear cuenta"
              : "Recuperar contraseña"}
        </p>

        {mode === "recovery" ? (
          <form onSubmit={handleRecovery} className="space-y-3">
            <p className="text-muted-foreground text-sm text-balance">
              Te mandamos un link al correo para elegir una contraseña nueva.
            </p>
            <EmailField email={email} setEmail={setEmail} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Enviar link
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
            <PasswordField
              id="password"
              value={password}
              onChange={setPassword}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
            />
            {mode === "signin" && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-xs transition"
                  onClick={() => {
                    setRecoverySent(false);
                    setMode("recovery");
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
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

        <div className="text-center text-sm">
          {mode === "recovery" ? (
            <button
              type="button"
              className="text-foreground font-medium hover:underline"
              onClick={() => setMode("signin")}
            >
              Volver al inicio de sesión
            </button>
          ) : mode === "signin" ? (
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
