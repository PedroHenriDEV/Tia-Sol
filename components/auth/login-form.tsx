'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      router.replace(params.get('next') || '/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block text-sm font-medium text-[var(--foreground)]">
        E-mail
        <div className="relative mt-2">
          <Mail className="absolute left-3 top-3 text-[var(--muted)]" size={18} />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input pl-10"
            placeholder="voce@empresa.com"
          />
        </div>
      </label>

      <label className="block text-sm font-medium text-[var(--foreground)]">
        Senha
        <div className="relative mt-2">
          <LockKeyhole className="absolute left-3 top-3 text-[var(--muted)]" size={18} />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pl-10"
            placeholder="••••••••"
          />
        </div>
      </label>

      {error && (
        <p role="alert" className="feedback-error">
          {error}
        </p>
      )}

      <button disabled={loading} className="button-primary w-full">
        {loading && <LoaderCircle className="animate-spin" size={18} />}
        Entrar
      </button>
    </form>
  );
}
