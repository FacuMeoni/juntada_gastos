import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppContainer } from "@/components/layout/app-container";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <AppContainer className="justify-center gap-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold tracking-tight">
          Nueva contraseña
        </h1>
        <p className="text-muted-foreground text-sm">{user.email}</p>
      </div>
      <ResetPasswordForm />
    </AppContainer>
  );
}
