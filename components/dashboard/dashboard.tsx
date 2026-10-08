import { AlertTriangle, ArrowRight, CalendarDays, CalendarRange, CheckCircle2, Package, Plus, Users, Wallet, Clock, FileSignature, CreditCard } from 'lucide-react';
import Link from 'next/link';
import type { EventRecord } from '@/types/event';
import type { Client, Package as PackageRecord } from '@/types/database';
import type { FinancialTransaction } from '@/types/finance';
import type { Material } from '@/types/inventory';
import { EmptyState } from '@/components/ui/empty-state';
import { getEventUrgency } from '@/lib/event-urgency';

type Props = { events: EventRecord[]; clients: Client[]; packages: PackageRecord[]; transactions: FinancialTransaction[]; materials: Material[] };

const money = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
const date = (v: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(v + 'T12:00:00'));

function tone(t: 'primary' | 'secondary' | 'accent' | 'success') {
  return t === 'secondary' ? 'bg-[var(--secondary-soft)] text-[var(--secondary)]' : t === 'accent' ? 'bg-[var(--accent-soft)] text-[var(--warning)]' : t === 'success' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--primary-soft)] text-[var(--primary)]';
}

export function Dashboard({ events, clients, packages, transactions, materials }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const upcoming = events.filter(e => e.status !== 'cancelado' && e.event_date >= today);
  const urgent = upcoming.filter(e => getEventUrgency(e.event_date).reminder).slice(0, 3);
  const received = transactions.filter(t => t.type === 'receita' && t.status === 'pago').reduce((s, t) => s + Number(t.amount), 0);
  const pending = transactions.filter(t => t.type === 'receita' && t.status === 'pendente').reduce((s, t) => s + Number(t.amount), 0);
  const monthRevenue = transactions.filter(t => t.type === 'receita' && t.status === 'pago' && (t.paid_at?.startsWith(month) || t.due_date.startsWith(month))).reduce((s, t) => s + Number(t.amount), 0);
  const monthExpenses = transactions.filter(t => t.type === 'despesa' && t.status === 'pago' && (t.paid_at?.startsWith(month) || t.due_date.startsWith(month))).reduce((s, t) => s + Number(t.amount), 0);
  const monthResult = monthRevenue - monthExpenses;
  const monthEvents = events.filter(e => e.event_date.startsWith(month) && e.status !== 'cancelado').length;
  const unsignedContracts = events.filter(e => e.status === 'contrato_gerado').length;
  const lowStock = materials.filter(m => Number(m.quantity) <= Number(m.minimum_quantity));
  const metrics = [
    [CalendarRange, 'Próximos eventos', String(upcoming.length), 'Compromissos futuros', 'primary', '/eventos'],
    [Users, 'Clientes ativos', String(clients.filter(c => c.active).length), 'Cadastros ativos', 'secondary', '/clientes'],
    [Package, 'Pacotes ativos', String(packages.filter(p => p.active).length), 'Experiências disponíveis', 'accent', '/pacotes'],
    [Wallet, 'A receber', money(pending), 'Receitas pendentes', 'success', '/financeiro'],
    [CalendarDays, 'Eventos no mês', String(monthEvents), 'Eventos programados', 'primary', '/agenda'],
  ] as const;

  return <div className="space-y-6 lg:space-y-8">
    <section className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] px-6 py-7 shadow-[var(--shadow-soft)] sm:px-8">
      <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full border-[18px] border-[var(--accent)]/20" />
      <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div><p className="section-label">Painel de controle</p><h1 className="display-title mt-2 text-4xl sm:text-5xl">Bom dia, Tia Sol! ☀️</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">Resumo da operação e do que precisa de atenção.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/clientes" className="button-secondary"><Users size={16}/> Novo cliente</Link><Link href="/eventos" className="button-primary"><Plus size={17}/> Novo evento</Link></div>
      </div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([Icon, label, value, note, t, href]) => <Link key={label} href={href} className="group rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
        <div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-full ${tone(t)}`}><Icon size={18}/></span><ArrowRight size={16} className="text-[var(--muted)] transition group-hover:translate-x-1"/></div>
        <p className="mt-5 text-xs font-semibold text-[var(--muted-foreground)]">{label}</p><p className="display-title mt-1 text-2xl sm:text-3xl">{value}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{note}</p>
      </Link>)}
    </section>

    <section className="grid gap-3 sm:grid-cols-3">
      <Link href="/relatorios" className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"><p className="text-xs font-semibold text-[var(--muted-foreground)]">Resultado do mês</p><p className={`mt-1 text-xl font-bold ${monthResult >= 0 ? 'text-[var(--success)]' : 'text-red-600'}`}>{money(monthResult)}</p><p className="mt-1 text-[11px] text-[var(--muted)]">Receitas menos despesas pagas</p></Link>
      <Link href="/contratos" className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"><p className="text-xs font-semibold text-[var(--muted-foreground)]">Contratos pendentes</p><p className="mt-1 text-xl font-bold text-amber-600">{unsignedContracts}</p><p className="mt-1 text-[11px] text-[var(--muted)]">Aguardando assinatura</p></Link>
      <Link href="/relatorios" className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"><p className="text-xs font-semibold text-[var(--muted-foreground)]">Total recebido</p><p className="mt-1 text-xl font-bold text-[var(--success)]">{money(received)}</p><p className="mt-1 text-[11px] text-[var(--muted)]">Receitas pagas registradas</p></Link>
    </section>

    {urgent.length > 0 && <section className="rounded-[20px] border border-red-200 bg-red-50 p-4 sm:p-5">
      <div className="flex items-center gap-2"><AlertTriangle size={18} className="text-red-600"/><div><p className="text-sm font-bold text-red-800">Eventos que precisam de atenção</p><p className="text-xs text-red-700">Há eventos nos próximos 10 dias.</p></div></div>
      <div className="mt-3 grid gap-2 lg:grid-cols-3">{urgent.map(e => { const u=getEventUrgency(e.event_date); return <Link key={e.id} href="/eventos" className={`rounded-xl border bg-white/70 p-3 ${u.softClassName}`}><div className="flex justify-between gap-2"><span className="truncate text-sm font-semibold">{e.title}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${u.className}`}>{u.label}</span></div><p className="mt-1 text-xs text-[var(--muted-foreground)]">{date(e.event_date)} · {e.start_time.slice(0,5)}</p></Link>})}</div>
    </section>}

    <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div><p className="section-label">ATENÇÃO</p><h2 className="display-title mt-1 text-2xl">Lembretes e pendências</h2><p className="mt-1 text-xs text-[var(--muted-foreground)]">O que precisa ser resolvido antes dos próximos eventos.</p></div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">{[
          ...upcoming.filter(e => { const d=Math.ceil((new Date(e.event_date+'T12:00:00').getTime()-new Date(today+'T12:00:00').getTime())/86400000); return d >= 0 && d <= 10; }),
          ...events.filter(e => e.status !== 'cancelado' && Number(e.received_amount) < Number(e.total_amount)),
          ...events.filter(e => e.status === 'contrato_gerado'),
          ...lowStock
        ].length} itens</span>
      </div>
      <div className="grid gap-2 p-5 sm:grid-cols-2 sm:p-6">
        {[
          ...upcoming.filter(e => { const d=Math.ceil((new Date(e.event_date+'T12:00:00').getTime()-new Date(today+'T12:00:00').getTime())/86400000); return d >= 0 && d <= 10; }).slice(0,3).map(e => ({ icon: Clock, title: `Evento próximo: ${e.title}`, note: `${date(e.event_date)} · ${e.start_time.slice(0,5)}`, href: `/eventos/${e.id}`, tone: 'amber' })),
          ...events.filter(e => e.status !== 'cancelado' && Number(e.received_amount) < Number(e.total_amount)).slice(0,3).map(e => ({ icon: CreditCard, title: `Pagamento pendente: ${e.title}`, note: `Saldo ${money(Math.max(0, Number(e.total_amount)-Number(e.received_amount))) }`, href: `/eventos/${e.id}`, tone: 'red' })),
          ...events.filter(e => e.status === 'contrato_gerado').slice(0,3).map(e => ({ icon: FileSignature, title: `Contrato aguardando assinatura: ${e.title}`, note: date(e.event_date), href: `/eventos/${e.id}`, tone: 'blue' })),
          ...lowStock.slice(0,3).map(m => ({ icon: Package, title: `Estoque baixo: ${m.name}`, note: `${m.quantity} ${m.unit} · mínimo ${m.minimum_quantity}`, href: '/estoque', tone: 'amber' }))
        ].slice(0,8).map((item, index) => {
          const Icon = item.icon;
          return <Link key={`${item.title}-${index}`} href={item.href} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 transition hover:bg-[var(--muted)]/20">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--muted)]/20"><Icon size={16}/></span>
            <span className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{item.note}</p></span>
            <ArrowRight size={14} className="shrink-0 text-[var(--muted)]"/>
          </Link>;
        })}
        {upcoming.filter(e => { const d=Math.ceil((new Date(e.event_date+'T12:00:00').getTime()-new Date(today+'T12:00:00').getTime())/86400000); return d >= 0 && d <= 10; }).length === 0 &&
          events.filter(e => e.status !== 'cancelado' && Number(e.received_amount) < Number(e.total_amount)).length === 0 &&
          events.filter(e => e.status === 'contrato_gerado').length === 0 &&
          lowStock.length === 0 && <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} className="mb-2 text-emerald-600"/>Tudo em dia. Nenhum lembrete pendente.</div>}
      </div>
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.65fr)]">
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 sm:px-6"><div><p className="section-label">Agenda</p><h2 className="display-title mt-1 text-2xl">Próximas festas</h2></div><Link href="/agenda" className="text-xs font-bold text-[var(--primary)] hover:underline">Ver agenda</Link></div>
        <div className="p-5 sm:p-6">{upcoming.length ? <div className="space-y-3">{upcoming.slice(0,5).map(e => { const u=getEventUrgency(e.event_date); return <Link key={e.id} href="/eventos" className={`group flex items-center gap-3 rounded-2xl border p-3 transition hover:shadow-sm ${u.softClassName}`}><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-center ${u.className}`}><span className="text-[10px] font-bold">{date(e.event_date)}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{e.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><CalendarDays size={12}/>{e.start_time.slice(0,5)} · {e.location || 'Local não informado'}</p></div><span className={`hidden rounded-full px-2 py-1 text-[10px] font-bold sm:inline-flex ${u.className}`}>{u.label}</span><ArrowRight size={15} className="text-[var(--muted)]"/></Link>})}</div> : <EmptyState icon={CalendarDays} title="Sua próxima celebração aparecerá aqui" description="Cadastre um evento para vê-lo neste painel."/>}</div>
      </div>
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
        <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6"><p className="section-label">Financeiro</p><h2 className="display-title mt-1 text-2xl">Resumo do mês</h2></div>
        <div className="space-y-4 p-5 sm:p-6"><div className="rounded-2xl bg-[var(--success-soft)] p-4"><p className="text-xs font-semibold text-[var(--muted-foreground)]">Receitas do mês</p><p className="mt-1 text-xl font-bold text-[var(--success)]">{money(monthRevenue)}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-[var(--border)] p-3"><p className="text-[11px] text-[var(--muted)]">Recebido</p><p className="mt-1 text-sm font-bold">{money(received)}</p></div><div className="rounded-2xl border border-[var(--border)] p-3"><p className="text-[11px] text-[var(--muted)]">Pendente</p><p className="mt-1 text-sm font-bold">{money(pending)}</p></div></div><Link href="/financeiro" className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)]">Abrir financeiro <ArrowRight size={13}/></Link></div>
      </div>
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]"><div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 sm:px-6"><div><p className="section-label">Estoque</p><h2 className="display-title mt-1 text-2xl">Materiais em atenção</h2></div><Link href="/estoque" className="text-xs font-bold text-[var(--primary)]">Ver estoque</Link></div><div className="p-5 sm:p-6">{lowStock.length ? <div className="space-y-2">{lowStock.slice(0,4).map(m => <Link key={m.id} href="/estoque" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><Package size={17} className="text-amber-700"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{m.name}</p><p className="text-xs text-amber-700">{m.quantity} {m.unit} · mínimo {m.minimum_quantity}</p></div><ArrowRight size={14} className="text-amber-700"/></Link>)}</div> : <div className="rounded-xl border border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]"><CheckCircle2 size={18} className="mb-2 text-[var(--success)]"/>Nenhum material abaixo do mínimo.</div>}</div></div>
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:p-6"><p className="section-label">Acesso rápido</p><h2 className="display-title mt-1 text-2xl">O que fazer agora?</h2><div className="mt-4 grid gap-2 sm:grid-cols-2"><Link href="/eventos" className="button-primary justify-center"><CalendarDays size={16}/> Novo evento</Link><Link href="/clientes" className="button-secondary justify-center"><Users size={16}/> Novo cliente</Link><Link href="/pacotes" className="button-secondary justify-center"><Package size={16}/> Novo pacote</Link><Link href="/financeiro" className="button-secondary justify-center"><Wallet size={16}/> Financeiro</Link><Link href="/relatorios" className="button-secondary justify-center"><CalendarRange size={16}/> Relatórios</Link><Link href="/contratos" className="button-secondary justify-center"><FileSignature size={16}/> Contratos</Link></div></div>
    </section>
  </div>;
}
