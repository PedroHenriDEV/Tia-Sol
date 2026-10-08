'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, LoaderCircle, LockKeyhole, Save, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateMyProfile, uploadMyAvatar } from '@/services/user-profile';

export function ProfileForm({ email, initialName, initialAvatarUrl }: { email: string; initialName: string; initialAvatarUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function saveProfile() {
    setMessage('');
    setLoading(true);
    try {
      await updateMyProfile(createClient(), { full_name: name });
      setMessage('Perfil salvo com sucesso.');
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Não foi possível salvar o perfil.');
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    setMessage('');
    if (newPassword.length < 8) return setMessage('A nova senha deve ter pelo menos 8 caracteres.');
    if (newPassword !== confirmation) return setMessage('As senhas não conferem.');
    setLoading(true);
    try {
      const { error } = await createClient().auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmation('');
      setMessage('Senha alterada com sucesso.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  }

  async function onAvatarChange(file?: File) {
    if (!file) return;
    setMessage('');
    setUploading(true);
    try {
      const supabase = createClient();
      const path = await uploadMyAvatar(supabase, file);
      const { data, error } = await supabase.storage.from('user-assets').createSignedUrl(path, 60 * 60);
      if (error) throw error;
      setAvatarUrl(data.signedUrl);
      setMessage('Foto de perfil atualizada.');
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Não foi possível enviar a foto.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-[var(--primary-soft)] bg-[var(--background)]" aria-label="Alterar foto de perfil">
            {avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover object-[50%_35%]" /> : <span className="grid h-full w-full place-items-center text-[var(--primary)]"><UserRound size={42}/></span>}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-2 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"><Camera size={14}/> Alterar</span>
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { void onAvatarChange(e.target.files?.[0]); e.currentTarget.value = ''; }} />
          <div><p className="section-label">Minha foto</p><h2 className="mt-1 text-lg font-semibold">Foto de perfil</h2><p className="mt-1 text-sm text-[var(--muted)]">JPG, PNG ou WEBP, até 5 MB.</p><button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="button-secondary mt-3">{uploading && <LoaderCircle className="animate-spin" size={16}/>} Escolher foto</button></div>
        </div>
      </section>

      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="mb-5"><p className="section-label">Dados pessoais</p><h2 className="mt-1 text-lg font-semibold">Minha conta</h2></div>
        <label className="block text-sm font-medium">Nome<input value={name} onChange={e => setName(e.target.value)} className="input mt-2" placeholder="Nome da responsável"/></label>
        <label className="mt-4 block text-sm font-medium">E-mail<input value={email} disabled className="input mt-2 opacity-70" /></label>
        <button type="button" disabled={loading || uploading} onClick={() => void saveProfile()} className="button-primary mt-5">{loading && <LoaderCircle className="animate-spin" size={17}/>}<Save size={17}/> Salvar perfil</button>
      </section>

      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="mb-5"><p className="section-label">Segurança</p><h2 className="mt-1 flex items-center gap-2 text-lg font-semibold"><LockKeyhole size={18}/> Alterar senha</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium">Nova senha<input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input mt-2" placeholder="Mínimo de 8 caracteres" autoComplete="new-password"/></label>
          <label className="block text-sm font-medium">Confirmar nova senha<input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className="input mt-2" placeholder="Repita a nova senha" autoComplete="new-password"/></label>
        </div>
        <button type="button" disabled={loading || !newPassword} onClick={() => void changePassword()} className="button-secondary mt-5">Alterar senha</button>
      </section>

      {message && <p role="status" className="text-sm font-medium text-[var(--primary)]">{message}</p>}
    </div>
  );
}
