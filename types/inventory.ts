export const MATERIAL_MOVEMENT_TYPES = ['entrada', 'saida'] as const;
export type MaterialMovementType = (typeof MATERIAL_MOVEMENT_TYPES)[number];

export type Material = {
  id: string;
  company_id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minimum_quantity: number;
  unit_cost: number;
  location: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type MaterialMovement = {
  id: string;
  company_id: string;
  material_id: string;
  event_id: string | null;
  type: MaterialMovementType;
  quantity: number;
  unit_cost: number | null;
  reason: string;
  created_at: string;
};
