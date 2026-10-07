import type { SupabaseClient } from '@supabase/supabase-js';
import type { Company } from '@/types/database';
import type { CompanyInput } from '@/validators/company';

export async function getMyCompany(supabase: SupabaseClient): Promise<Company | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) throw new Error('Usuário não autenticado.');

  const { data: membership, error: memberError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!membership) return null;
  const { data, error } = await supabase.from('companies').select('*').eq('id', membership.company_id).single();
  if (error) throw error;
  return data as Company;
}

export async function saveMyCompany(supabase: SupabaseClient, input: CompanyInput, companyId?: string) {
  if (!companyId) {
    const { data, error } = await supabase.rpc('bootstrap_company', { company_data: input });
    if (error) throw error;
    return data as string;
  }
  const { error } = await supabase.from('companies').update(input).eq('id', companyId);
  if (error) throw error;
  return companyId;
}
