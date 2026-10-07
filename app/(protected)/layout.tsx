import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { getMyProfile, getMyAvatarUrl } from '@/services/user-profile';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const profile = await getMyProfile(supabase);
  const avatarUrl = await getMyAvatarUrl(supabase, profile?.avatar_path ?? null);

  return (
    <AppShell
      email={user.email ?? 'Usuário'}
      fullName={profile?.full_name ?? ''}
      avatarUrl={avatarUrl}
    >
      {children}
    </AppShell>
  );
}
