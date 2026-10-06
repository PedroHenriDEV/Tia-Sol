import { CalendarDays, CalendarRange, Clock3, Wallet, Package } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

const overview = [
  { label: 'Eventos próximos', icon: CalendarRange },
  { label: 'Valores a receber', icon: Wallet },
  { label: 'Pacotes ativos', icon: Package },
] as const;

export function Dashboard() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden pb-2 pt-2">
        <span aria-hidden="true" className="absolute right-6 top-0 hidden h-24 w-24 rounded-full border-[10px] border-[var(--accent)]/15 sm:block" />
        <span aria-hidden="true" className="absolute right-20 top-12 hidden h-7 w-7 rounded-full bg-[var(--secondary)]/15 sm:block" />
        <p className="section-label">Bem-vinda de volta</p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
          Bom dia, Tia Sol
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Veja o que está acontecendo com seus eventos.
        </p>
      </section>

      <section aria-label="Resumo" className="flex flex-wrap items-stretch border-y border-[var(--border)] py-4 sm:py-5">
        {overview.map(({ label, icon: Icon }, index) => (
          <div
            key={label}
            className={`flex min-w-[50%] flex-1 items-center gap-3 py-2 sm:min-w-0 sm:px-5 sm:first:pl-0 ${
              index > 0 ? 'sm:border-l sm:border-[var(--border)]' : ''
            }`}
          >
            <Icon size={17} strokeWidth={1.8} className="shrink-0 text-[var(--primary)]" />
            <div>
              <p className="text-[11px] leading-4 text-[var(--muted)] sm:text-xs">{label}</p>
              <p className="mt-1 text-lg font-semibold leading-5 text-[var(--foreground)]">—</p>
            </div>
          </div>
        ))}
      </section>
      <p className="-mt-8 text-[11px] text-[var(--muted)]">
        Os números serão atualizados quando os módulos correspondentes estiverem disponíveis.
      </p>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:gap-12">
        <div className="min-w-0">
          <div className="mb-4 flex items-end justify-between border-b border-[var(--border)] pb-3">
            <div>
              <p className="section-label">Na agenda</p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">Próximos eventos</h2>
            </div>
            <CalendarRange size={18} className="mb-1 text-[var(--primary)]" strokeWidth={1.8} />
          </div>
          <EmptyState
            icon={CalendarDays}
            title="Sua próxima celebração aparecerá aqui"
            description="O módulo de eventos ainda não está disponível. Nenhum evento de exemplo está sendo exibido."
          />
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex items-end justify-between border-b border-[var(--border)] pb-3">
            <div>
              <p className="section-label">Hoje</p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">Agenda de hoje</h2>
            </div>
            <Clock3 size={18} className="mb-1 text-[var(--primary)]" strokeWidth={1.8} />
          </div>
          <div className="relative ml-2 border-l border-[var(--border)] py-4 pl-6">
            <span className="absolute -left-[5px] top-5 h-[9px] w-[9px] rounded-full border-2 border-[var(--primary)] bg-[var(--background)]" />
            <p className="text-sm font-medium text-[var(--foreground)]">Um dia leve por aqui</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              A agenda ainda não está disponível. Nenhum compromisso fictício está sendo exibido.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
