import type { SupabaseClient } from '@supabase/supabase-js';
import type { Package } from '@/types/database';
import type { PackageInput } from '@/validators/package';

export async function getCurrentCompanyId(supabase: SupabaseClient): Promise<string> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) {
    throw new Error('Usuário não autenticado.');
  }

  const { data: membership, error } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();

  if (error) throw error;
  if (!membership) throw new Error('Empresa não encontrada para este usuário.');

  return membership.company_id as string;
}

export async function listPackages(supabase: SupabaseClient): Promise<Package[]> {
  const companyId = await getCurrentCompanyId(supabase);
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('company_id', companyId)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // O banco pode conter registros históricos com diferenças apenas de capitalização.
  // Para a operação da Tia Sol, cada pacote deve aparecer uma única vez.
  const uniquePackages = new Map<string, Package>();

  for (const item of (data ?? []) as Package[]) {
    const key = item.name.trim().toLocaleLowerCase('pt-BR');
    const current = uniquePackages.get(key);

    // Prefere o nome oficial "Pacote ..." quando houver duplicata.
    if (!current || /^Pacote\b/.test(item.name)) {
      uniquePackages.set(key, item);
    }
  }

  return Array.from(uniquePackages.values());
}

export async function createPackage(supabase: SupabaseClient, input: PackageInput): Promise<Package> {
  const companyId = await getCurrentCompanyId(supabase);
  const payload = {
    company_id: companyId,
    name: input.name,
    description: input.description || null,
    price: Number(input.price),
    duration: Number(input.duration),
    activities: input.activities,
    notes: input.notes || null,
    active: input.active,
  };

  const { data, error } = await supabase.from('packages').insert(payload).select().single();
  if (error) throw error;
  return data as Package;
}

export async function updatePackage(supabase: SupabaseClient, packageId: string, input: PackageInput): Promise<Package> {
  const payload = {
    name: input.name,
    description: input.description || null,
    price: Number(input.price),
    duration: Number(input.duration),
    activities: input.activities,
    notes: input.notes || null,
    active: input.active,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('packages').update(payload).eq('id', packageId).select().single();
  if (error) throw error;
  return data as Package;
}

export async function togglePackageStatus(supabase: SupabaseClient, packageId: string, active: boolean): Promise<Package> {
  const { data, error } = await supabase
    .from('packages')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', packageId)
    .select()
    .single();

  if (error) throw error;
  return data as Package;
}
