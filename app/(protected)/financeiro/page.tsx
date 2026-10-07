import { createClient } from '@/lib/supabase/server';
import { listEvents } from '@/services/events';
import { listFinancialTransactions } from '@/services/finance';
import { FinanceManager } from '@/components/finance/finance-manager';

export default async function FinanceiroPage() {
  const supabase = await createClient();

  try {
    const [transactions, events] = await Promise.all([
      listFinancialTransactions(supabase),
      listEvents(supabase),
    ]);

    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="section-label">Administracao</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)] md:text-3xl">
            Financeiro
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Controle de receitas, despesas, vencimentos e pagamentos.
          </p>
        </div>
        <FinanceManager
          initialTransactions={transactions}
          events={events.map((event) => ({ id: event.id, title: event.title }))}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="feedback-error p-5">
          <p className="font-semibold">Nao foi possivel carregar o Financeiro.</p>
          <p className="mt-2 text-sm">
            {error instanceof Error
              ? error.message
              : 'Verifique sua empresa e a configuracao do Supabase.'}
          </p>
        </div>
      </div>
    );
  }
}
