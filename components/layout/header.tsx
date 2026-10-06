'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Visão geral', subtitle: 'Acompanhe o dia e os próximos eventos.' },
  '/em-breve/agenda': { title: 'Agenda', subtitle: 'Compromissos e eventos da Tia Sol.' },
  '/em-breve/clientes': { title: 'Clientes', subtitle: 'Relacionamento e informações dos clientes.' },
  '/em-breve/eventos': { title: 'Eventos', subtitle: 'Organização dos eventos da Tia Sol.' },
  '/pacotes': { title: 'Pacotes', subtitle: 'Serviços de recreação oferecidos pela Tia Sol.' },
  '/em-breve/financeiro': { title: 'Financeiro', subtitle: 'Acompanhamento financeiro dos eventos.' },
  '/em-breve/contratos': { title: 'Contratos', subtitle: 'Documentos e contratos dos eventos.' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Dados e preferências da empresa.' },
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
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 backdrop-blur-sm md:px-8">
      <button
        type="button"
        onClick={onMenu}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--card)] lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-[var(--foreground)] md:text-base">{copy.title}</p>
        <p className="hidden truncate text-xs text-[var(--muted)] sm:block">{copy.subtitle}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden text-right sm:block">
          <p className="max-w-48 truncate text-sm font-medium text-[var(--foreground)]">{email}</p>
          <p className="text-xs text-[var(--muted)]">TIA SOL</p>
        </div>

        <details className="group relative">
          <summary
            aria-label="Abrir menu da conta"
            className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)] outline-none transition-colors hover:bg-[var(--primary)] hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--primary)] [&::-webkit-details-marker]:hidden"
          >
            <UserRound size={18} strokeWidth={1.8} />
          </summary>
          <div className="absolute right-0 top-12 z-50 w-56 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-2 shadow-[var(--shadow-soft)]">
            <p className="truncate px-3 py-2 text-xs text-[var(--muted)] sm:hidden">{email}</p>
            <button
              type="button"
              onClick={logout}
              className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--background)]"
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
