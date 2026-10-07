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
