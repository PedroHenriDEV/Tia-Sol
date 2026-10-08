import type { SupabaseClient } from '@supabase/supabase-js';
import type { EventInput } from '@/validators/event';
import type { EventRecord } from '@/types/event';
import { getCurrentCompanyId } from './packages';

const eventSelect = '*, client:clients(*), package:packages(*)';

export async function listEvents(supabase: SupabaseClient, from?: string, to?: string): Promise<EventRecord[]> {
  const companyId = await getCurrentCompanyId(supabase);
  let query = supabase.from('events').select(eventSelect).eq('company_id', companyId).order('event_date').order('start_time');
  if (from) query = query.gte('event_date', from);
  if (to) query = query.lte('event_date', to);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as EventRecord[];
}

export async function getEventById(supabase: SupabaseClient, id: string): Promise<EventRecord | null> {
  const companyId = await getCurrentCompanyId(supabase);
  const { data, error } = await supabase
    .from('events')
    .select(eventSelect)
    .eq('company_id', companyId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as EventRecord | null;
}

export async function checkEventConflict(
  supabase: SupabaseClient,
  input: Pick<EventInput, 'event_date' | 'start_time' | 'end_time'>,
  excludeId?: string,
): Promise<boolean> {
  const companyId = await getCurrentCompanyId(supabase);
  const { data, error } = await supabase.rpc('has_event_conflict', {
    p_company_id: companyId,
    p_event_date: input.event_date,
    p_start_time: input.start_time,
    p_end_time: input.end_time,
    p_exclude_id: excludeId ?? null,
  });
  if (error) throw error;
  return Boolean(data);
}

function payload(input: EventInput) {
  return {
    title: input.title,
    client_id: input.client_id,
    package_id: input.package_id,
    event_date: input.event_date,
    start_time: input.start_time,
    end_time: input.end_time,
    location: input.location || null,
    status: input.status,
    total_amount: Number(input.total_amount),
    received_amount: Number(input.received_amount),
    notes: input.notes || null,
  };
}

export async function createEvent(supabase: SupabaseClient, input: EventInput): Promise<EventRecord> {
  const companyId = await getCurrentCompanyId(supabase);
  if (await checkEventConflict(supabase, input)) throw new Error('Já existe outro evento nesse horário.');
  const { data, error } = await supabase.from('events').insert({ company_id: companyId, ...payload(input) }).select(eventSelect).single();
  if (error) throw error;
  return data as EventRecord;
}

export async function updateEvent(supabase: SupabaseClient, id: string, input: EventInput): Promise<EventRecord> {
  if (await checkEventConflict(supabase, input, id)) throw new Error('Já existe outro evento nesse horário.');
  const { data, error } = await supabase.from('events').update({ ...payload(input), updated_at: new Date().toISOString() }).eq('id', id).select(eventSelect).single();
  if (error) throw error;
  return data as EventRecord;
}

export async function deleteEvent(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}