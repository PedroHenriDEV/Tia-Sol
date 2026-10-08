import { createClient } from '@/lib/supabase/server';
import { listEvents } from '@/services/events';
import { listFinancialTransactions } from '@/services/finance';
import type { EventRecord } from '@/types/event';
import type { FinancialTransaction } from '@/types/finance';

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

export default async function RelatoriosPage() {
  const supabase = await createClient();
  let events: EventRecord[] = [];
  let transactions: FinancialTransaction[] = [];
  let errorMessage: string | null = null;

  try {
    [events, transactions] = await Promise.all([
      listEvents(supabase),
      listFinancialTransactions(supabase),
    ]);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Não foi possível carregar os relatórios.';
  }

  if (errorMessage) return <div className="feedback-error p-5"><p className="font-semibold">Não foi possível carregar os relatórios.</p><p className="mt-2 text-sm">{errorMessage}</p></div>;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter((t) => monthKey(t.due_date) === currentMonth);
  const revenue = monthTransactions.filter((t) => t.type === 'receita' && t.status === 'pago').reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = monthTransactions.filter((t) => t.type === 'despesa' && t.status === 'pago').reduce((sum, t) => sum + Number(t.amount), 0);
  const pending = transactions.filter((t) => t.status !== 'pago').reduce((sum, t) => sum + Number(t.amount), 0);
  const upcoming = events.filter((e) => e.event_date >= new Date().toISOString().slice(0, 10) && e.status !== 'cancelado').sort((a,b) => a.event_date.localeCompare(b.event_date)).slice(0, 8);
  const completed = events.filter((e) => ['finalizado','pagamento_completo'].includes(e.status)).length;

  const statusCounts = events.reduce<Record<string, number>>((acc, e) => { acc[e.status] = (acc[e.status] ?? 0) + 1; return acc; }, {});
  const maxStatus = Math.max(1, ...Object.values(statusCounts));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="section-label">Gestão</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Relatórios</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Visão consolidada da operação, eventos e financeiro.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Receitas no mês', money(revenue)],
          ['Despesas no mês', money(expenses)],
          ['Resultado no mês', money(revenue - expenses)],
          ['A receber', money(pending)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-semibold">Eventos por status</h2>
          <div className="mt-5 space-y-4">
            {Object.entries(statusCounts).length === 0 ? <p className="text-sm text-[var(--muted)]">Nenhum evento cadastrado.</p> : Object.entries(statusCounts).map(([status, count]) => (
              <div key={status}>
                <div className="mb-1 flex justify-between text-xs"><span className="capitalize">{status.replaceAll('_',' ')}</span><strong>{count}</strong></div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--background)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${(count / maxStatus) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-[var(--muted)]">{completed} eventos concluídos ou quitados.</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-semibold">Próximos eventos</h2>
          <div className="mt-4 divide-y divide-[var(--border)]">
            {upcoming.length === 0 ? <p className="py-6 text-sm text-[var(--muted)]">Nenhum próximo evento.</p> : upcoming.map((event) => (
              <a key={event.id} href={`/eventos/${event.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{event.title}</p><p className="text-xs text-[var(--muted)]">{event.event_date} · {event.client?.name ?? 'Cliente não informado'}</p></div>
                <span className="shrink-0 text-xs font-semibold">{money(Math.max(0, Number(event.total_amount) - Number(event.received_amount)))}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)]">
        <h2 className="font-semibold">Resumo financeiro por categoria</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {Object.entries(monthTransactions.reduce<Record<string, number>>((acc, t) => {
            const key = t.category || 'Sem categoria';
            acc[key] = (acc[key] ?? 0) + (t.type === 'receita' ? Number(t.amount) : -Number(t.amount));
            return acc;
          }, {})).sort((a,b) => Math.abs(b[1]) - Math.abs(a[1])).map(([category, value]) => (
            <div key={category} className="flex items-center justify-between rounded-xl bg-[var(--background)] px-4 py-3"><span className="text-sm">{category}</span><strong className="text-sm">{money(value)}</strong></div>
          ))}
        </div>
      </section>
    </div>
  );
}