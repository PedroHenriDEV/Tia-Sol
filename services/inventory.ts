import type { SupabaseClient } from '@supabase/supabase-js';
import type { Material, MaterialMovement } from '@/types/inventory';
import type { MaterialInput, MaterialMovementInput } from '@/validators/inventory';
import { getCurrentCompanyId } from './packages';

export async function listMaterials(supabase: SupabaseClient): Promise<Material[]> {
  const companyId = await getCurrentCompanyId(supabase);
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('company_id', companyId)
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return (data ?? []) as Material[];
}

export async function listMaterialMovements(
  supabase: SupabaseClient,
  materialId?: string,
): Promise<MaterialMovement[]> {
  const companyId = await getCurrentCompanyId(supabase);
  let query = supabase
    .from('material_movements')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (materialId) query = query.eq('material_id', materialId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MaterialMovement[];
}

export async function createMaterial(
  supabase: SupabaseClient,
  input: MaterialInput,
): Promise<Material> {
  const companyId = await getCurrentCompanyId(supabase);
  const { data, error } = await supabase
    .from('materials')
    .insert({
      company_id: companyId,
      name: input.name.trim(),
      category: input.category.trim(),
      unit: input.unit.trim(),
      minimum_quantity: Number(input.minimum_quantity),
      unit_cost: Number(input.unit_cost),
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Material;
}

export async function updateMaterial(
  supabase: SupabaseClient,
  id: string,
  input: MaterialInput,
): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .update({
      name: input.name.trim(),
      category: input.category.trim(),
      unit: input.unit.trim(),
      minimum_quantity: Number(input.minimum_quantity),
      unit_cost: Number(input.unit_cost),
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as Material;
}

export async function registerMaterialMovement(
  supabase: SupabaseClient,
  input: MaterialMovementInput,
): Promise<MaterialMovement> {
  const { data, error } = await supabase.rpc('register_material_movement', {
    p_material_id: input.material_id,
    p_event_id: input.event_id,
    p_type: input.type,
    p_quantity: Number(input.quantity),
    p_reason: input.reason.trim(),
    p_unit_cost: input.unit_cost === null ? null : Number(input.unit_cost),
  });

  if (error) throw error;
  return data as MaterialMovement;
}
export type MaterialPurchaseInput = {
  material_id: string;
  event_id: string | null;
  quantity: number;
  unit_cost: number;
  reason: string;
  due_date: string;
  status: 'pendente' | 'pago';
};

export async function registerMaterialPurchase(
  supabase: SupabaseClient,
  input: MaterialPurchaseInput,
): Promise<MaterialMovement> {
  const { data, error } = await supabase.rpc('register_material_purchase', {
    p_material_id: input.material_id,
    p_event_id: input.event_id,
    p_quantity: Number(input.quantity),
    p_unit_cost: Number(input.unit_cost),
    p_reason: input.reason.trim(),
    p_due_date: input.due_date,
    p_status: input.status,
  });

  if (error) throw error;
  return data as MaterialMovement;
}
