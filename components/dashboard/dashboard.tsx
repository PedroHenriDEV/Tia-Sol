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
  { label: 'Eventos próximos', value: '—', note: 'Agenda', tone: 'var(--primary)' },
  { label: 'Clientes ativos', value: '—', note: 'Cadastro', tone: 'var(--secondary)' },
  { label: 'Pacotes ativos', value: '—', note: 'Catálogo', tone: 'var(--warning)' },
  { label: 'A receber', value: '—', note: 'Financeiro', tone: 'var(--success)' },
] as const;

const shortcuts = [
  { href: '/clientes', icon: Users, label: 'Novo cliente', hint: 'Cadastrar contato', tone: 'var(--primary)' },
  { href: '/em-breve/eventos', icon: CalendarDays, label: 'Novo evento', hint: 'Adicionar à agenda', tone: 'var(--secondary)' },
  { href: '/pacotes', icon: Package, label: 'Novo pacote', hint: 'Criar experiência', tone: 'var(--warning)' },
  { href: '/em-breve/contratos', icon: FileText, label: 'Contratos', hint: 'Ver documentos', tone: 'var(--foreground)' },
] as const;

export function Dashboard() {
  return (
    <div className="space-y-12 lg:space-y-16">
      <section className="border-b border-[var(--border-strong)] pb-10 sm:pb-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className="section-label">Visão geral</p>
            <h1 className="display-title mt-3 text-4xl leading-[1.02] sm:text-6xl">
              Bom dia, Tia Sol! <span aria-hidden>☀️</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-[15px]">
              Um espaço simples para organizar suas festas, clientes e compromissos.
            </p>
          </div>

          <Link href="/em-breve/eventos" className="button-primary self-start md:self-auto">
            <Plus size={17} />
            Novo evento
          </Link>
        </div>
      </section>

      <section aria-label="Resumo" className="grid border-y border-[var(--border-strong)] sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, note, tone }, index) => (
          <div
            key={label}
            className={[
              'relative py-6 sm:px-6 sm:py-7',
              index > 0 ? 'border-t border-[var(--border)] sm:border-l sm:border-t-0' : '',
            ].join(' ')}
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  {label}
                </p>
                <p className="display-title mt-2 text-4xl" style={{ color: tone }}>
                  {value}
                </p>
              </div>
              <span className="mb-1 text-xs font-medium text-[var(--muted)]">{note}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-12 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,.7fr)]">
        <div>
          <div className="flex items-end justify-between gap-5 border-b border-[var(--border-strong)] pb-4">
            <div>
              <p className="section-label">Agenda</p>
              <h2 className="display-title mt-1 text-2xl sm:text-3xl">Próximas festas</h2>
            </div>
            <CalendarRange size={20} className="mb-1 text-[var(--secondary)]" />
          </div>

          <div className="py-8">
            <EmptyState
              icon={CalendarDays}
              title="Sua próxima celebração aparecerá aqui"
              description="Quando você cadastrar um evento, os detalhes da próxima festa serão mostrados neste espaço."
            />
          </div>
        </div>

        <div>
          <div className="border-b border-[var(--border-strong)] pb-4">
            <p className="section-label">Atalhos</p>
            <h2 className="display-title mt-1 text-2xl sm:text-3xl">O que fazer agora?</h2>
          </div>

          <div>
            {shortcuts.map(({ href, icon: Icon, label, hint, tone }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-4 border-b border-[var(--border)] py-4 transition-colors hover:bg-white/60"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--card)]"
                  style={{ color: tone }}
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-sm">{label}</strong>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">{hint}</span>
                </span>
                <ArrowRight
                  size={16}
                  className="ml-auto text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--foreground)]"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-10 border-t border-[var(--border-strong)] pt-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
        <div>
          <div className="flex items-start gap-4">
            <Sparkles size={20} className="mt-1 shrink-0 text-[var(--warning)]" />
            <div>
              <p className="section-label">Organização</p>
              <h2 className="display-title mt-2 text-2xl sm:text-4xl">
                Tudo começa com um bom cadastro.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--muted-foreground)]">
                Clientes, pacotes, eventos, contratos e financeiro vão se conectar ao longo do sistema.
              </p>
              <Link href="/clientes" className="button-secondary mt-6">
                Cadastrar primeiro cliente
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[var(--primary)] pl-6 lg:pl-8">
          <p className="section-label">Tia Sol</p>
          <h2 className="display-title mt-2 text-2xl sm:text-3xl">
            Grandes momentos começam com um bom planejamento.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Um espaço feito para deixar o trabalho organizado e a festa acontecer com leveza.
          </p>
        </div>
      </section>
    </div>
  );
}
