'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Visão geral', subtitle: 'Seu dia, suas festas e o que merece atenção.' },
  '/clientes': { title: 'Clientes', subtitle: 'Pessoas e famílias que confiam na Tia Sol.' },
  '/pacotes': { title: 'Pacotes', subtitle: 'Experiências de recreação prontas para cada festa.' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Preferências e dados do espaço de trabalho.' },
  '/em-breve/agenda': { title: 'Agenda', subtitle: 'Compromissos e eventos da Tia Sol.' },
  '/em-breve/eventos': { title: 'Eventos', subtitle: 'Organize cada festa do começo ao fim.' },
  '/em-breve/financeiro': { title: 'Financeiro', subtitle: 'Valores recebidos, pendências e próximos pagamentos.' },
  '/em-breve/contratos': { title: 'Contratos', subtitle: 'Documentos dos eventos e seus detalhes.' },
};

export function Header({ email, onMenu }: { email: string; onMenu: () => void }) {
  const router = useRouter();
  const path = usePathname();
  const copy = pageCopy[path] ?? { title: 'TIA SOL', subtitle: 'Gestão de Eventos & Recreação' };

  async function logout() {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-[var(--background)]/90 backdrop-blur-xl" style={{ borderColor: 'var(--border)' }}>
      <div className="flex min-h-[82px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--card)] lg:hidden" aria-label="Abrir menu">
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--primary)]">TIA SOL</p>
          <h1 className="display-title mt-0.5 truncate text-xl sm:text-[22px]">{copy.title}</h1>
          <p className="hidden text-xs text-[var(--muted-foreground)] sm:block">{copy.subtitle}</p>
        </div>
        <div className="ml-auto">
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border bg-[var(--card)] px-2.5 py-2 outline-none transition hover:border-[#d8c8c0] [&::-webkit-details-marker]:hidden" style={{ borderColor: 'var(--border)' }}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><UserRound size={17} /></span>
              <span className="hidden max-w-44 text-left sm:block">
                <span className="block truncate text-xs font-bold">{email}</span>
                <span className="block text-[10px] text-[var(--muted)]">Minha conta</span>
              </span>
              <ChevronDown size={15} className="hidden text-[var(--muted)] transition group-open:rotate-180 sm:block" />
            </summary>
            <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border bg-[var(--card)] p-2 shadow-[var(--shadow-soft)]" style={{ borderColor: 'var(--border)' }}>
              <button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold hover:bg-[var(--background)]">
                <LogOut size={16} /> Sair da conta
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
