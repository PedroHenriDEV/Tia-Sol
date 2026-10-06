import type { SupabaseClient } from '@supabase/supabase-js';
import type { Client } from '@/types/database';
import type { ClientInput } from '@/validators/client';
import { getCurrentCompanyId } from './packages';

export async function listClients(supabase: SupabaseClient): Promise<Client[]> {
  const companyId = await getCurrentCompanyId(supabase);
  const { data, error } = await supabase.from('clients').select('*').eq('company_id', companyId).order('name');
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function createClientRecord(supabase: SupabaseClient, input: ClientInput): Promise<Client> {
  const companyId = await getCurrentCompanyId(supabase);
  const { data, error } = await supabase.from('clients').insert({
    company_id: companyId, name: input.name, document: input.document || null, phone: input.phone || null,
    whatsapp: input.whatsapp || null, email: input.email || null, address: input.address || null,
    city: input.city || null, state: input.state ? input.state.toUpperCase() : null,
    notes: input.notes || null, active: input.active,
  }).select().single();
  if (error) throw error;
  return data as Client;
}

export async function updateClientRecord(supabase: SupabaseClient, id: string, input: ClientInput): Promise<Client> {
  const { data, error } = await supabase.from('clients').update({
    name: input.name, document: input.document || null, phone: input.phone || null, whatsapp: input.whatsapp || null,
    email: input.email || null, address: input.address || null, city: input.city || null,
    state: input.state ? input.state.toUpperCase() : null, notes: input.notes || null,
    active: input.active, updated_at: new Date().toISOString(),
  }).eq('id', id).select().single();
  if (error) throw error;
  return data as Client;
}

export async function toggleClientStatus(supabase: SupabaseClient, id: string, active: boolean): Promise<Client> {
  const { data, error } = await supabase.from('clients').update({ active, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as Client;
}