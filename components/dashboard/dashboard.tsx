import { CalendarDays, CalendarRange, Wallet, Package, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

export function Dashboard() {
  return <div className="space-y-12">
    <section className="relative pb-2 pt-2">
      <div className="absolute -right-3 -top-8 hidden h-28 w-28 rounded-full border-[14px] border-[var(--accent)]/15 sm:block" />
      <p className="section-label">Bom te ver por aqui</p>
      <div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h1 className="display-title text-4xl sm:text-5xl">Olá, Tia Sol <span aria-hidden>☀️</span></h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">Uma visão leve do que está acontecendo com suas festas, clientes e próximos compromissos.</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Link href="/clientes" className="button-primary">Novo atendimento</Link>
          <Link href="/pacotes" className="button-secondary">Pacotes <ArrowUpRight size={15}/></Link>
        </div>
      </div>
    </section>

    <section className="grid divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0" style={{borderColor:'var(--border)'}}>
      {[['Eventos próximos',CalendarRange,'Agenda e compromissos'],['A receber',Wallet,'Valores pendentes'],['Pacotes ativos',Package,'Catálogo de recreação']].map(([label,Icon,description])=>
        <div key={String(label)} className="flex items-center gap-4 py-5 sm:px-5 first:sm:pl-0 last:sm:pr-0">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={18}/></span>
          <div><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs text-[var(--muted)]">{description}</p></div>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Em breve</span>
        </div>)}
    </section>

    <section className="grid gap-12 lg:grid-cols-[1.4fr_.6fr]">
      <div>
        <div className="mb-6 flex items-end justify-between border-b pb-4" style={{borderColor:'var(--border)'}}>
          <div><p className="section-label">Na agenda</p><h2 className="display-title mt-1 text-2xl">Próximas festas</h2></div>
          <CalendarRange size={19} className="text-[var(--secondary)]"/>
        </div>
        <EmptyState icon={CalendarDays} title="Sua próxima celebração aparecerá aqui" description="Assim que os eventos forem cadastrados, eles aparecerão nesta área."/>
      </div>
      <div>
        <div className="mb-6 border-b pb-4" style={{borderColor:'var(--border)'}}><p className="section-label">Hoje</p><h2 className="display-title mt-1 text-2xl">Um dia de cada vez</h2></div>
        <div className="border-l-2 border-[var(--accent)]/30 py-2 pl-5"><p className="text-sm font-bold">Tudo pronto para organizar</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">A agenda real será preenchida pelos seus eventos.</p></div>
      </div>
    </section>
  </div>;
}