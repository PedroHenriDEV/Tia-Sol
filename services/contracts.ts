import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContractInput } from '@/validators/contract';
import type { ContractRecord } from '@/types/contract';
import { getCurrentCompanyId } from './packages';

const contractSelect = '*, client:clients(*), package:packages(*)';

export async function listContracts(supabase: SupabaseClient): Promise<ContractRecord[]> {
  const companyId = await getCurrentCompanyId(supabase);
  const { data, error } = await supabase.from('contracts').select(contractSelect).eq('company_id', companyId).order('contract_year', { ascending: false }).order('contract_number', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContractRecord[];
}

export async function createContract(supabase: SupabaseClient, input: ContractInput, generatedText: string): Promise<ContractRecord> {
  const companyId = await getCurrentCompanyId(supabase);
  const year = new Date().getFullYear();
  const { data: last } = await supabase.from('contracts').select('contract_number').eq('company_id', companyId).eq('contract_year', year).order('contract_number', { ascending: false }).limit(1).maybeSingle();
  const nextNumber = Number(last?.contract_number ?? 0) + 1;
  const payload = {
    company_id: companyId,
    ...input,
    contractor_document: input.contractor_document || null,
    contractor_rg: input.contractor_rg || null,
    contractor_address: input.contractor_address || null,
    contractor_phone: input.contractor_phone || null,
    contractor_email: input.contractor_email || null,
    event_date: input.event_date || null,
    start_time: input.start_time || null,
    end_time: input.end_time || null,
    event_location: input.event_location || null,
    event_location_type: input.event_location_type || null,
    deposit_date: input.deposit_date || null,
    balance_due_date: input.balance_due_date || null,
    payment_method: input.payment_method || null,
    pix_key: input.pix_key || null,
    additional_payment_terms: input.additional_payment_terms || null,
    additional_observations: input.additional_observations || null,
    contract_details: input.contract_details || null,
    generated_text: generatedText,
    contract_year: year,
    contract_number: nextNumber,
  };
  let { data, error } = await supabase.from('contracts').insert(payload).select(contractSelect).single();
  // Compatibilidade com bancos ainda sem a migration displacement_amount.
  if (error?.message?.includes("Could not find the 'displacement_amount' column")) {
    const { displacement_amount: _displacementAmount, ...legacyPayload } = payload;
    const retry = await supabase.from('contracts').insert(legacyPayload).select(contractSelect).single();
    data = retry.data;
    error = retry.error;
  }
  if (!error && data) return data as ContractRecord;

  // A restrição UNIQUE no banco protege contra numeração duplicada em concorrência.
  // Se outra criação venceu a corrida, recalculamos o próximo número e tentamos uma vez.
  if (error?.code === '23505') {
    const { data: retryLast } = await supabase
      .from('contracts')
      .select('contract_number')
      .eq('company_id', companyId)
      .eq('contract_year', year)
      .order('contract_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const retryPayload = { ...payload, contract_number: Number(retryLast?.contract_number ?? 0) + 1 };
    const { data: retryData, error: retryError } = await supabase
      .from('contracts')
      .insert(retryPayload)
      .select(contractSelect)
      .single();

    if (!retryError && retryData) return retryData as ContractRecord;
    throw retryError ?? error;
  }

  throw error;
}

export async function updateContract(supabase: SupabaseClient, id: string, input: ContractInput, generatedText: string): Promise<ContractRecord> {
  const payload = {
    ...input,
    contractor_document: input.contractor_document || null,
    contractor_rg: input.contractor_rg || null,
    contractor_address: input.contractor_address || null,
    contractor_phone: input.contractor_phone || null,
    contractor_email: input.contractor_email || null,
    event_date: input.event_date || null,
    start_time: input.start_time || null,
    end_time: input.end_time || null,
    event_location: input.event_location || null,
    event_location_type: input.event_location_type || null,
    deposit_date: input.deposit_date || null,
    balance_due_date: input.balance_due_date || null,
    payment_method: input.payment_method || null,
    pix_key: input.pix_key || null,
    additional_payment_terms: input.additional_payment_terms || null,
    additional_observations: input.additional_observations || null,
    contract_details: input.contract_details || null,
    generated_text: generatedText,
    updated_at: new Date().toISOString(),
  };
  let { data, error } = await supabase.from('contracts').update(payload).eq('id', id).select(contractSelect).single();
  // Compatibilidade com bancos ainda sem a migration displacement_amount.
  if (error?.message?.includes("Could not find the 'displacement_amount' column")) {
    const { displacement_amount: _displacementAmount, ...legacyPayload } = payload;
    const retry = await supabase.from('contracts').update(legacyPayload).eq('id', id).select(contractSelect).single();
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  return data as ContractRecord;
}

export async function deleteContract(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) throw error;
}