import { createClient } from '@/lib/supabase/server';
import { getMyProfile, getMyAvatarUrl } from '@/services/user-profile';
import { ProfileForm } from '@/components/profile/profile-form';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const profile = await getMyProfile(supabase);
  const avatarUrl = await getMyAvatarUrl(supabase, profile?.avatar_path ?? null);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="section-label">Minha conta</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Perfil</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Gerencie seus dados, foto e senha de acesso.</p>
      </div>
      <ProfileForm email={authData.user?.email ?? ''} initialName={profile?.full_name ?? ''} initialAvatarUrl={avatarUrl} />
    </div>
  );
}
