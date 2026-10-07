'use client';

import Link from 'next/link';
import { CalendarDays, LayoutDashboard, MoreHorizontal, PartyPopper } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const path = usePathname();
  const items = [['/dashboard', 'Início', LayoutDashboard], ['/em-breve/agenda', 'Agenda', CalendarDays], ['/em-breve/eventos', 'Eventos', PartyPopper], ['/configuracoes', 'Mais', MoreHorizontal]] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/96 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map(([href, label, Icon]) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href + '/'));
          return <Link key={href} href={href} className={'flex min-w-[68px] flex-col items-center gap-1 rounded-[13px] px-3 py-1.5 text-[10px] font-bold transition ' + (active ? 'text-[var(--primary)]' : 'text-[var(--muted)]')}>
            <span className={'grid h-8 w-8 place-items-center rounded-full ' + (active ? 'bg-[var(--primary-soft)]' : '')}><Icon size={17} strokeWidth={active ? 2.1 : 1.8} /></span>{label}
          </Link>;
        })}
      </div>
    </nav>
  );
}
