import { CalendarDays, CalendarRange, Clock3, Wallet, Package, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

export function Dashboard() {
  return <div className="space-y-8">
    <section className="relative overflow-hidden rounded-[28px] border bg-[var(--card)] p-6 shadow-[var(--shadow-card)] sm:p-8" style={{borderColor:'var(--border)'}}>
      <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[18px] border-[var(--accent)]/15"/>
      <div className="absolute right-24 top-10 h-7 w-7 rounded-full bg-[var(--primary)]/10"/>
      <div className="relative max-w-2xl">
        <p className="section-label">Bom te ver por aqui</p>
        <h1 className="display-title mt-2 text-3xl sm:text-4xl">Olá, Tia Sol <span aria-hidden>☀️</span></h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">Tenha uma visão tranquila do que está acontecendo com suas festas, clientes e próximos compromissos.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/clientes" className="button-primary"><CalendarDays size={17}/> Novo atendimento</Link>
          <Link href="/pacotes" className="button-secondary">Ver pacotes <ArrowUpRight size={16}/></Link>
        </div>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-3">
      {[['Eventos próximos',CalendarRange,'Quando o módulo de eventos estiver ativo'],['A receber',Wallet,'Valores dos eventos cadastrados'],['Pacotes ativos',Package,'Seu catálogo de recreação']].map(([label,Icon,description])=><div key={String(label)} className="surface p-5"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={18}/></span><span className="text-xs text-[var(--muted)]">Em breve</span></div><p className="mt-5 text-sm font-bold">{label}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</p></div>)}
    </section>

    <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
      <div className="surface p-5 sm:p-6">
        <div className="mb-5 flex items-end justify-between"><div><p className="section-label">Na agenda</p><h2 className="display-title mt-1 text-2xl">Próximas festas</h2></div><CalendarRange size={19} className="text-[var(--secondary)]"/></div>
        <EmptyState icon={CalendarDays} title="Sua próxima celebração aparecerá aqui" description="Assim que os eventos forem cadastrados, eles aparecerão nesta área sem dados fictícios."/>
      </div>
      <div className="surface p-5 sm:p-6">
        <div className="mb-5"><p className="section-label">Hoje</p><h2 className="display-title mt-1 text-2xl">Um dia de cada vez</h2></div>
        <div className="relative border-l-2 border-[var(--accent)]/30 py-2 pl-5"><span className="absolute -left-[7px] top-3 h-3 w-3 rounded-full border-2 border-[var(--accent)] bg-[var(--card)]"/><p className="text-sm font-bold">Tudo pronto para organizar</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">A agenda real será preenchida pelos seus eventos.</p></div>
      </div>
    </section>
  </div>;
}