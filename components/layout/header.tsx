'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Visão geral', subtitle: 'Seu dia, suas festas e o que merece atenção.' },
  '/clientes': { title: 'Clientes', subtitle: 'Pessoas e famílias que confiam na Tia Sol.' },
  '/pacotes': { title: 'Pacotes', subtitle: 'Experiências de recreação prontas para cada festa.' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Preferências e dados do espaço de trabalho.' },
  '/perfil': { title: 'Perfil', subtitle: 'Seus dados, foto e segurança de acesso.' },
  '/agenda': { title: 'Agenda', subtitle: 'Compromissos e eventos da Tia Sol.' },
  '/eventos': { title: 'Eventos', subtitle: 'Organize cada festa do começo ao fim.' },
  '/financeiro': { title: 'Financeiro', subtitle: 'Valores recebidos, pendências e próximos pagamentos.' },
  '/em-breve/contratos': { title: 'Contratos', subtitle: 'Documentos dos eventos e seus detalhes.' },
};

export function Header({ email, fullName, avatarUrl, onMenu }: { email: string; fullName: string; avatarUrl: string | null; onMenu: () => void }) {
  const router = useRouter();
  const path = usePathname();
  const copy = pageCopy[path] ?? { title: 'TIA SOL', subtitle: 'Gestão de Eventos & Recreação' };

  async function logout() {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-[var(--background)]/92 backdrop-blur-xl" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto flex min-h-[74px] w-full max-w-[1580px] items-center gap-3 px-5 sm:px-8 lg:px-10">
        <button type="button" onClick={onMenu} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--muted-foreground)] transition hover:bg-[var(--card)] hover:text-[var(--foreground)] lg:hidden" aria-label="Abrir menu"><Menu size={20} /></button>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-[var(--primary)]">TIA SOL</p>
          <h1 className="display-title mt-0.5 truncate text-xl sm:text-[22px]">{copy.title}</h1>
          <p className="hidden text-[11px] text-[var(--muted-foreground)] sm:block">{copy.subtitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden h-9 w-px bg-[var(--border)] sm:block" />
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[14px] border bg-[var(--card)] px-2 py-1.5 outline-none transition hover:border-[var(--border-strong)] [&::-webkit-details-marker]:hidden" style={{ borderColor: 'var(--border)' }}>
              <span className="grid h-8 w-8 overflow-hidden rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center"><UserRound size={16} /></span>}
              </span>
              <span className="hidden max-w-44 text-left sm:block"><span className="block truncate text-[11px] font-bold">{fullName || email}</span><span className="block text-[9px] text-[var(--muted)]">Minha conta</span></span>
              <ChevronDown size={14} className="hidden text-[var(--muted)] transition group-open:rotate-180 sm:block" />
            </summary>
            <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border bg-[var(--card)] p-2 shadow-[var(--shadow-soft)]" style={{ borderColor: 'var(--border)' }}>
              <Link href="/perfil" className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition hover:bg-[var(--background)]"><UserRound size={16} />Meu perfil</Link>
              <button type="button" onClick={logout} className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold transition hover:bg-[var(--background)]"><LogOut size={16} />Sair da conta</button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
