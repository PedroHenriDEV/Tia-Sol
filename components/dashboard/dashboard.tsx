import {
  ArrowRight,
  CalendarDays,
  CalendarRange,
  FileText,
  Package,
  Plus,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

const metrics = [
  { icon: CalendarRange, label: 'Eventos próximos', value: '—', note: 'Sua agenda aparecerá aqui', tone: 'primary' },
  { icon: Users, label: 'Clientes ativos', value: '—', note: 'Dados reais do cadastro', tone: 'secondary' },
  { icon: Package, label: 'Pacotes ativos', value: '—', note: 'Seu catálogo de recreação', tone: 'accent' },
  { icon: Wallet, label: 'A receber', value: '—', note: 'Valores dos eventos', tone: 'success' },
] as const;

const shortcuts = [
  { href: '/clientes', icon: Users, label: 'Novo cliente', hint: 'Cadastrar contato', tone: 'primary' },
  { href: '/em-breve/eventos', icon: CalendarDays, label: 'Novo evento', hint: 'Adicionar à agenda', tone: 'secondary' },
  { href: '/pacotes', icon: Package, label: 'Novo pacote', hint: 'Criar experiência', tone: 'accent' },
  { href: '/em-breve/contratos', icon: FileText, label: 'Contratos', hint: 'Ver documentos', tone: 'neutral' },
] as const;

function metricTone(tone: (typeof metrics)[number]['tone']) {
  if (tone === 'secondary') return 'bg-[var(--secondary-soft)] text-[var(--secondary)]';
  if (tone === 'accent') return 'bg-[var(--accent-soft)] text-[var(--warning)]';
  if (tone === 'success') return 'bg-[var(--success-soft)] text-[var(--success)]';
  return 'bg-[var(--primary-soft)] text-[var(--primary)]';
}

function shortcutTone(tone: (typeof shortcuts)[number]['tone']) {
  if (tone === 'secondary') return 'bg-[var(--secondary-soft)] text-[var(--secondary)]';
  if (tone === 'accent') return 'bg-[var(--accent-soft)] text-[var(--warning)]';
  if (tone === 'neutral') return 'bg-[#f3f2ef] text-[var(--foreground)]';
  return 'bg-[var(--primary-soft)] text-[var(--primary)]';
}

export function Dashboard() {
  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] px-6 py-7 shadow-[var(--shadow-soft)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full border-[18px] border-[var(--accent)]/20" />
        <div className="pointer-events-none absolute right-20 top-12 h-3 w-3 rounded-full bg-[var(--secondary)]/70" />
        <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="section-label">Visão geral</p>
            <h1 className="display-title mt-2 text-4xl leading-[1.05] sm:text-5xl">
              Bom dia, Tia Sol! <span aria-hidden>☀️</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-[15px]">
              Um resumo simples do que está acontecendo com suas festas, clientes e compromissos.
            </p>
          </div>
          <Link href="/em-breve/eventos" className="button-primary self-start md:self-auto">
            <Plus size={17} />
            Novo evento
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ icon: Icon, label, value, note, tone }) => (
          <div key={label} className="group rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
            <div className="flex items-center justify-between">
              <span className={"grid h-10 w-10 place-items-center rounded-full " + metricTone(tone)}>
                <Icon size={18} strokeWidth={2} />
              </span>
              <ArrowRight size={16} className="text-[var(--muted)] transition group-hover:translate-x-1" />
            </div>
            <p className="mt-6 text-xs font-semibold text-[var(--muted-foreground)]">{label}</p>
            <p className="display-title mt-1 text-3xl">{value}</p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">{note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.65fr)]">
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <div>
              <p className="section-label">Agenda</p>
              <h2 className="display-title mt-1 text-2xl">Próximas festas</h2>
            </div>
            <CalendarDays size={19} className="text-[var(--secondary)]" />
          </div>
          <div className="p-5 sm:p-6">
            <EmptyState icon={CalendarDays} title="Sua próxima celebração aparecerá aqui" description="Quando você cadastrar um evento, os detalhes da próxima festa serão mostrados neste espaço." />
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
          <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <p className="section-label">Acesso rápido</p>
            <h2 className="display-title mt-1 text-2xl">O que fazer agora?</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {shortcuts.map(({ href, icon: Icon, label, hint, tone }) => (
              <Link key={href} href={href} className="group flex items-center gap-3 px-5 py-4 transition hover:bg-[var(--background)] sm:px-6">
                <span className={"grid h-10 w-10 shrink-0 place-items-center rounded-xl " + shortcutTone(tone)}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-sm">{label}</strong>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">{hint}</span>
                </span>
                <ArrowRight size={16} className="ml-auto text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--foreground)]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)] sm:p-7">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="section-label">Organização</p>
              <h2 className="display-title mt-1 text-2xl sm:text-3xl">Tudo começa com um bom cadastro.</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted-foreground)]">
                Clientes, pacotes, eventos, contratos e financeiro vão se conectar ao longo do sistema.
              </p>
            </div>
            <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--warning)] sm:grid">
              <Sparkles size={18} />
            </span>
          </div>
          <Link href="/clientes" className="button-secondary mt-6">
            Cadastrar primeiro cliente
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-[20px] border border-[var(--primary)]/15 bg-[var(--primary-soft)] p-6 sm:p-7">
          <div className="pointer-events-none absolute -bottom-12 -right-8 h-32 w-32 rounded-full border-[18px] border-[var(--accent)]/50" />
          <p className="section-label">Tia Sol</p>
          <h2 className="display-title mt-2 max-w-md text-2xl sm:text-3xl">Grandes momentos começam com um bom planejamento.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Um espaço feito para deixar o trabalho organizado e a festa acontecer com leveza.
          </p>
        </div>
      </section>
    </div>
  );
}
