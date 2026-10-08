import type { SupabaseClient } from '@supabase/supabase-js';

export type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

export async function getMyProfile(supabase: SupabaseClient): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('users').select('*').maybeSingle();
  if (error) throw error;
  return data as UserProfile | null;
}

export async function updateMyProfile(
  supabase: SupabaseClient,
  input: { full_name?: string; avatar_path?: string | null },
) {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  const updates: Record<string, string | null> = {};
  if (input.full_name !== undefined) updates.full_name = input.full_name.trim() || null;
  if (input.avatar_path !== undefined) updates.avatar_path = input.avatar_path;

  const { error } = await supabase.from('users').update(updates).eq('id', userData.user.id);
  if (error) throw error;
}

export async function uploadMyAvatar(supabase: SupabaseClient, file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Use uma imagem JPG, PNG ou WEBP.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('A foto deve ter no máximo 5 MB.');
  }

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userData.user.id}/avatar.${extension}`;

  const { error } = await supabase.storage
    .from('user-assets')
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });

  if (error) throw error;

  await updateMyProfile(supabase, { avatar_path: path });
  return path;
}

export async function getMyAvatarUrl(supabase: SupabaseClient, path: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from('user-assets').createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
