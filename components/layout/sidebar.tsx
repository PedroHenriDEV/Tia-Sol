'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, ChartNoAxesCombined, FileSignature, LayoutDashboard, Package, PartyPopper, Settings, Users, X } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const groups = [
  { label: 'DIA A DIA', items: [['/dashboard', 'Visão geral', LayoutDashboard], ['/agenda', 'Agenda', CalendarDays]] },
  { label: 'FESTAS', items: [['/em-breve/eventos', 'Eventos', PartyPopper], ['/clientes', 'Clientes', Users], ['/pacotes', 'Pacotes', Package]] },
  { label: 'ADMINISTRAÇÃO', items: [['/financeiro', 'Financeiro', ChartNoAxesCombined], ['/em-breve/contratos', 'Contratos', FileSignature]] },
] as const;

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();

  return (
    <>
      <button type="button" aria-label="Fechar menu" onClick={onClose} className={'fixed inset-0 z-40 bg-[var(--foreground)]/25 backdrop-blur-[2px] transition-opacity lg:hidden ' + (open ? 'visible opacity-100' : 'invisible opacity-0')} />
      <aside aria-label="Navegação principal" className={'fixed inset-y-0 left-0 z-50 flex w-[min(var(--sidebar-width),calc(100vw-1.25rem))] flex-col border-r bg-[var(--card)] transition-transform duration-300 lg:translate-x-0 ' + (open ? 'translate-x-0' : '-translate-x-full')} style={{ borderColor: 'var(--border)' }}>
        <div className="px-6 pb-6 pt-7"><Logo variant="sidebar" /></div>
        <nav className="flex-1 overflow-y-auto px-4 pb-5">
          {groups.map((group) => (
            <div key={group.label} className="mb-7">
              <p className="px-3 pb-2 text-[9px] font-bold tracking-[0.19em] text-[#a3a7aa]">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(([href, label, Icon]) => {
                  const active = path === href || (href !== '/dashboard' && path.startsWith(href + '/'));
                  return (
                    <Link key={href} href={href} onClick={onClose} aria-current={active ? 'page' : undefined} className={'group relative flex min-h-11 items-center gap-3 rounded-[13px] px-3.5 text-[13px] transition duration-200 ' + (active ? 'bg-[var(--primary-soft)] font-bold text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:bg-[var(--background)] hover:text-[var(--foreground)]')}>
                      {active && <span className="absolute left-0 top-2.5 h-6 w-1 rounded-r-full bg-[var(--primary)]" />}
                      <span className={'grid h-8 w-8 place-items-center rounded-lg transition ' + (active ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-[var(--muted)] group-hover:text-[var(--primary)]')}><Icon size={17} strokeWidth={active ? 2.1 : 1.8} /></span>
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <Link href="/configuracoes" onClick={onClose} className={'flex items-center gap-3 rounded-[13px] px-3.5 py-3 text-[13px] font-semibold transition hover:bg-[var(--background)] ' + (path === '/configuracoes' ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'text-[var(--muted-foreground)]')}>
            <Settings size={18} /><span>Configurações</span>
          </Link>
          <p className="mt-3 px-3 text-[10px] leading-4 text-[var(--muted)]">Festas que viram memórias.</p>
        </div>
        <button type="button" onClick={onClose} className="absolute right-4 top-5 grid h-9 w-9 place-items-center rounded-xl text-[var(--muted)] hover:bg-[var(--background)] lg:hidden" aria-label="Fechar menu"><X size={18} /></button>
      </aside>
    </>
  );
}
