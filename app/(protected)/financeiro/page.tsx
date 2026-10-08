import { createClient } from '@/lib/supabase/server';
import { listEvents } from '@/services/events';
import { listFinancialTransactions } from '@/services/finance';
import { getMyCompany } from '@/services/company';
import { FinanceManager } from '@/components/finance/finance-manager';
import type { EventRecord } from '@/types/event';
import type { FinancialTransaction } from '@/types/finance';
import type { Company } from '@/types/database';

export default async function FinanceiroPage() {
  const supabase = await createClient();

  let transactions: FinancialTransaction[] = [];
  let events: EventRecord[] = [];
  let company: Company | null = null;
  let errorMessage: string | null = null;

  try {
    [transactions, events, company] = await Promise.all([
      listFinancialTransactions(supabase),
      listEvents(supabase),
      getMyCompany(supabase),
    ]);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : 'Verifique sua empresa e a configuração do Supabase.';
  }

  if (errorMessage) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="feedback-error p-5">
          <p className="font-semibold">Não foi possível carregar o Financeiro.</p>
          <p className="mt-2 text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="section-label">Administração</p>
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
        company={company}
      />
    </div>
  );
}
