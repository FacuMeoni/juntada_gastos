import { createClient } from "@/lib/supabase/server";
import { ProfilePageShell } from "@/components/profile/profile-page-shell";

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
    <ProfilePageShell
      userId={user.id}
      initialName={profile?.name ?? ""}
      initialAlias={profile?.alias_cvu ?? ""}
      initialAvatarUrl={profile?.avatar_url ?? null}
      email={user.email ?? ""}
    />
  );
}
