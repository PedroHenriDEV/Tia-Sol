import type { SupabaseClient } from '@supabase/supabase-js';
import type { FinancialInput } from '@/validators/finance';
import type { FinancialTransaction } from '@/types/finance';
import { getCurrentCompanyId } from './packages';

export async function listFinancialTransactions(
  supabase: SupabaseClient,
): Promise<FinancialTransaction[]> {
  const companyId = await getCurrentCompanyId(supabase);
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('company_id', companyId)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as FinancialTransaction[];
}

function toPayload(input: FinancialInput) {
  return {
    type: input.type,
    event_id: input.event_id,
    description: input.description.trim(),
    category: input.category.trim(),
    amount: Number(input.amount),
    due_date: input.due_date,
    paid_at: input.status === 'pago'
      ? input.paid_at || new Date().toISOString()
      : null,
    status: input.status,
    notes: input.notes?.trim() || null,
  };
}

export async function createFinancialTransaction(
  supabase: SupabaseClient,
  input: FinancialInput,
): Promise<FinancialTransaction> {
  const companyId = await getCurrentCompanyId(supabase);
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert({ company_id: companyId, ...toPayload(input) })
    .select('*')
    .single();

  if (error) throw error;
  return data as FinancialTransaction;
}

export async function updateFinancialTransaction(
  supabase: SupabaseClient,
  id: string,
  input: FinancialInput,
): Promise<FinancialTransaction> {
  const { data, error } = await supabase
    .from('financial_transactions')
    .update({ ...toPayload(input), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as FinancialTransaction;
}

export async function deleteFinancialTransaction(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}


export async function registerEventPayment(
  supabase: SupabaseClient,
  event: {
    id: string;
    title: string;
    company_id: string;
    total_amount: number;
    received_amount: number;
  },
  input: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
  },
): Promise<FinancialTransaction> {
  const amount = Number(input.amount);
  if (!amount || amount <= 0) throw new Error('O valor do pagamento deve ser maior que zero.');

  const newReceived = Number(event.received_amount) + amount;
  if (newReceived > Number(event.total_amount)) {
    throw new Error('O pagamento não pode ser maior que o saldo pendente.');
  }

  const nextStatus = newReceived >= Number(event.total_amount) && Number(event.total_amount) > 0
    ? 'pagamento_completo'
    : 'pagamento_parcial';

  const { data: transaction, error: transactionError } = await supabase
    .from('financial_transactions')
    .insert({
      company_id: event.company_id,
      event_id: event.id,
      type: 'receita',
      description: 'Pagamento — ' + event.title,
      category: 'Evento',
      amount,
      due_date: input.paymentDate,
      paid_at: new Date(input.paymentDate + 'T12:00:00').toISOString(),
      status: 'pago',
      notes: 'Forma de pagamento: ' + input.paymentMethod,
    })
    .select('*')
    .single();

  if (transactionError) throw transactionError;

  const { data: updatedEvent, error: eventError } = await supabase
    .from('events')
    .update({
      received_amount: newReceived,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', event.id)
    .eq('received_amount', Number(event.received_amount))
    .select('id')
    .maybeSingle();

  if (eventError || !updatedEvent) {
    await supabase.from('financial_transactions').delete().eq('id', transaction.id);
    throw new Error('O evento foi alterado por outra operação. Atualize a página e registre o pagamento novamente.');
  }

  return transaction as FinancialTransaction;
}
