'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (authError) throw authError;

      if (!data.session) {
        router.replace('/login?registered=1');
        return;
      }

      router.replace('/configuracoes');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o acesso.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block text-sm font-medium">
        Nome
        <div className="relative mt-2">
          <UserRound className="absolute left-3 top-3 text-[var(--muted)]" size={18} />
          <input required value={fullName} onChange={e => setFullName(e.target.value)} className="input pl-10" placeholder="Nome da responsável" autoComplete="name" />
        </div>
      </label>
      <label className="block text-sm font-medium">
        E-mail
        <div className="relative mt-2">
          <Mail className="absolute left-3 top-3 text-[var(--muted)]" size={18} />
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input pl-10" placeholder="voce@exemplo.com" autoComplete="email" />
        </div>
      </label>
      <label className="block text-sm font-medium">
        Senha
        <div className="relative mt-2">
          <LockKeyhole className="absolute left-3 top-3 text-[var(--muted)]" size={18} />
          <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="input pl-10 pr-11" placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--background)]" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
        </div>
      </label>
      <label className="block text-sm font-medium">
        Confirmar senha
        <div className="relative mt-2">
          <LockKeyhole className="absolute left-3 top-3 text-[var(--muted)]" size={18} />
          <input type={showConfirmation ? 'text' : 'password'} required value={confirmation} onChange={e => setConfirmation(e.target.value)} className="input pl-10 pr-11" placeholder="Repita a senha" autoComplete="new-password" />
          <button type="button" onClick={() => setShowConfirmation(v => !v)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--background)]" aria-label={showConfirmation ? 'Ocultar confirmação' : 'Mostrar confirmação'}>{showConfirmation ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
        </div>
      </label>
      {error && <p role="alert" className="feedback-error">{error}</p>}
      <button disabled={loading} className="button-primary w-full">{loading && <LoaderCircle className="animate-spin" size={18}/>} Criar meu acesso</button>
      <p className="text-center text-sm text-[var(--muted-foreground)]">Já possui acesso? <Link href="/login" className="font-semibold text-[var(--primary)]">Entrar</Link></p>
    </form>
  );
}
