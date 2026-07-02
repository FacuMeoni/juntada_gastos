import { Suspense } from "react";
import { Users } from "lucide-react";
import { AppContainer } from "@/components/layout/app-container";
import { LoginForm } from "@/components/auth/login-form";
import { LoginSystemTheme } from "@/components/auth/login-system-theme";

export default function LoginPage() {
  return (
    <LoginSystemTheme>
      <AppContainer className="justify-center gap-8 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl shadow-lg">
            <Users className="size-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">JuntadasApp</h1>
            <p className="text-muted-foreground mt-1 text-sm text-balance">
              Dividí gastos de viajes, asados y eventos con tus amigos.
            </p>
          </div>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </AppContainer>
    </LoginSystemTheme>
  );
}
