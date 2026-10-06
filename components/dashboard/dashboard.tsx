import { ArrowUpRight, CalendarDays, CalendarRange, ClipboardList, FileText, Package, Plus, Sparkles, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

const shortcuts = [
  { href: '/clientes', icon: Users, label: 'Cadastrar cliente', hint: 'Novo atendimento' },
  { href: '/pacotes', icon: Package, label: 'Criar pacote', hint: 'Montar uma opção' },
  { href: '/em-breve/eventos', icon: CalendarDays, label: 'Novo evento', hint: 'Adicionar à agenda' },
  { href: '/em-breve/contratos', icon: FileText, label: 'Contrato', hint: 'Gerar documento' },
];

const workflow = [
  ['01', 'Cliente', 'cadastro e contato'],
  ['02', 'Evento', 'data e detalhes'],
  ['03', 'Pacote', 'serviços escolhidos'],
  ['04', 'Contrato', 'documento e assinatura'],
];

export function Dashboard() {
  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden border-b-2 border-[var(--foreground)]/15 pb-9 pt-2">
        <div className="pointer-events-none absolute -right-8 -top-16 h-44 w-44 rounded-full border-[22px] border-[var(--accent)]/20" />
        <div className="pointer-events-none absolute right-24 top-16 hidden h-3 w-3 rounded-full bg-[var(--primary)] sm:block" />
        <p className="section-label">Painel de gestão</p>
        <div className="mt-3 flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <h1 className="display-title text-4xl sm:text-5xl lg:text-6xl">Olá, Tia Sol <span aria-hidden>☀️</span></h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
              Tudo o que importa para cuidar das suas festas, clientes e compromissos em um só lugar.
            </p>
          </div>
          <Link href="/em-breve/eventos" className="button-primary self-start md:self-auto"><Plus size={17} /> Novo evento</Link>
        </div>
      </section>

      <section className="grid border-y-2 border-[var(--foreground)]/12 md:grid-cols-3">
        {[
          { icon: CalendarRange, label: 'Próximos eventos', value: '—', note: 'agenda ainda sem eventos', tone: 'primary' },
          { icon: Wallet, label: 'A receber', value: '—', note: 'financeiro será preenchido aqui', tone: 'accent' },
          { icon: Package, label: 'Pacotes ativos', value: '—', note: 'catálogo de recreação', tone: 'secondary' },
        ].map(({ icon: Icon, label, value, note, tone }) => (
          <div key={label} className="group border-b-2 border-[var(--foreground)]/10 py-7 last:border-b-0 md:border-b-0 md:border-r-2 md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
            <div className="flex items-start justify-between gap-4">
              <span className={`grid h-11 w-11 place-items-center rounded-full ${tone === 'accent' ? 'bg-[var(--accent-soft)] text-[var(--warning)]' : tone === 'secondary' ? 'bg-[var(--secondary-soft)] text-[var(--secondary)]' : 'bg-[var(--primary-soft)] text-[var(--primary)]'}`}><Icon size={19} /></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Atualização real</span>
            </div>
            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
                <p className="display-title mt-1 text-4xl">{value}</p>
              </div>
              <p className="max-w-[150px] text-right text-xs leading-5 text-[var(--muted)]">{note}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between border-b-2 border-[var(--foreground)]/15 pb-4">
          <div><p className="section-label">Acesso rápido</p><h2 className="display-title mt-1 text-2xl sm:text-3xl">O que você quer fazer?</h2></div>
          <Sparkles size={20} className="text-[var(--accent)]" />
        </div>
        <div className="grid border-y-2 border-[var(--foreground)]/12 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map(({ href, icon: Icon, label, hint }) => (
            <Link key={href} href={href} className="group flex min-h-28 items-center gap-4 border-b-2 border-[var(--foreground)]/10 px-1 py-5 transition hover:bg-white/55 sm:border-r-2 sm:px-5 lg:border-b-0 lg:last:border-r-0">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[var(--border)] bg-[var(--card)] text-[var(--primary)] transition group-hover:border-[var(--primary)]"><Icon size={17} /></span>
              <span className="min-w-0"><strong className="block text-sm">{label}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{hint}</span></span>
              <ArrowUpRight size={16} className="ml-auto shrink-0 text-[var(--muted)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--primary)]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-12 lg:grid-cols-[1.35fr_.65fr]">
        <div>
          <div className="mb-6 flex items-end justify-between border-b-2 border-[var(--foreground)]/15 pb-4">
            <div><p className="section-label">Na agenda</p><h2 className="display-title mt-1 text-2xl sm:text-3xl">Próximas festas</h2></div>
            <CalendarRange size={20} className="text-[var(--secondary)]" />
          </div>
          <EmptyState icon={CalendarDays} title="Sua próxima celebração aparecerá aqui" description="Quando você cadastrar um evento, a agenda real ocupará este espaço." />
        </div>

        <div>
          <div className="mb-6 border-b-2 border-[var(--foreground)]/15 pb-4"><p className="section-label">Como funciona</p><h2 className="display-title mt-1 text-2xl sm:text-3xl">Do primeiro contato à festa</h2></div>
          <div className="divide-y-2 divide-[var(--foreground)]/10 border-y-2 border-[var(--foreground)]/12">
            {workflow.map(([number, title, description]) => (
              <div key={number} className="flex items-center gap-4 py-4">
                <span className="display-title w-8 text-lg text-[var(--accent)]">{number}</span>
                <div><p className="text-sm font-bold">{title}</p><p className="text-xs text-[var(--muted)]">{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t-2 border-[var(--foreground)]/15 pt-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="section-label">Organização</p><p className="mt-1 text-sm text-[var(--muted-foreground)]">Clientes, pacotes, agenda, contratos e financeiro vão se conectar aqui.</p></div>
          <Link href="/clientes" className="button-secondary self-start border-b-2 border-[var(--primary)] px-0">Começar pelos clientes <ArrowUpRight size={15} /></Link>
        </div>
      </section>
    </div>
  );
}
