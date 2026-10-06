'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  ChartNoAxesCombined,
  FileSignature,
  LayoutDashboard,
  Package,
  PartyPopper,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const primaryItems = [
  ['/dashboard', 'Dashboard', LayoutDashboard],
  ['/em-breve/agenda', 'Agenda', CalendarDays],
  ['/em-breve/clientes', 'Clientes', Users],
  ['/em-breve/eventos', 'Eventos', PartyPopper],
  ['/pacotes', 'Pacotes', Package],
  ['/em-breve/financeiro', 'Financeiro', ChartNoAxesCombined],
  ['/em-breve/contratos', 'Contratos', FileSignature],
] as const;

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();

  return (
    <>
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[var(--foreground)]/35 transition-opacity lg:hidden ${open ? 'visible opacity-100' : 'invisible opacity-0'}`}
      />

      <aside
        aria-label="Navegação principal"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(var(--sidebar-width),calc(100vw-2rem))] flex-col border-r border-[var(--border)] bg-[var(--card)] transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex min-h-[104px] items-center justify-between border-b border-[var(--border)] px-5">
          <Logo variant="sidebar" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--background)] lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {primaryItems.map(([href, label, Icon]) => {
            const active = path === href || (href !== '/dashboard' && path.startsWith(`${href}/`));

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm transition-colors ${
                  active
                    ? 'bg-[var(--primary-soft)] font-semibold text-[var(--primary)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--background)] hover:text-[var(--foreground)]'
                }`}
              >
                {active ? <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-[var(--primary)]" /> : null}
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
              </Link>
            );
          })}

          <div className="my-5 border-t border-[var(--border)]" />

          <Link
            href="/configuracoes"
            onClick={onClose}
            aria-current={path === '/configuracoes' ? 'page' : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm transition-colors ${
              path === '/configuracoes'
                ? 'bg-[var(--primary-soft)] font-semibold text-[var(--primary)]'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--background)] hover:text-[var(--foreground)]'
            }`}
          >
            <Settings size={18} strokeWidth={1.8} />
            <span>Configurações</span>
          </Link>
        </nav>

        <div className="border-t border-[var(--border)] px-5 py-4">
          <p className="text-xs font-medium text-[var(--muted)]">Um espaço feito para a Tia Sol</p>
        </div>
      </aside>
    </>
  );
}
