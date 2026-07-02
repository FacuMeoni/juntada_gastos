import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppContainer } from "@/components/layout/app-container";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, alias_cvu, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <AppContainer className="gap-5 p-4">
      <header className="flex items-center gap-2 pt-2">
        <Link
          href="/"
          aria-label="Volver"
          className="hover:bg-muted -ml-2 flex size-9 items-center justify-center rounded-full"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Mi perfil</h1>
      </header>

      <ProfileForm
        userId={user.id}
        initialName={profile?.name ?? ""}
        initialAlias={profile?.alias_cvu ?? ""}
        initialAvatarUrl={profile?.avatar_url ?? null}
        email={user.email ?? ""}
      />
    </AppContainer>
  );
}
