import { z } from 'zod';

export const materialSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do material.').max(180),
  category: z.string().trim().min(2, 'Informe a categoria.').max(100),
  unit: z.string().trim().min(1, 'Informe a unidade.').max(30),
  quantity: z.coerce.number().min(0, 'A quantidade atual não pode ser negativa.').default(0),
  minimum_quantity: z.coerce.number().min(0, 'O estoque mínimo não pode ser negativo.'),
  unit_cost: z.coerce.number().min(0, 'O custo não pode ser negativo.'),
  location: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const materialMovementSchema = z.object({
  material_id: z.string().uuid('Selecione um material.'),
  event_id: z.string().uuid().nullable(),
  type: z.enum(['entrada', 'saida']),
  quantity: z.coerce.number().positive('A quantidade deve ser maior que zero.'),
  unit_cost: z.coerce.number().min(0).nullable(),
  reason: z.string().trim().min(2, 'Informe o motivo.').max(180),
});

export type MaterialInput = z.infer<typeof materialSchema>;
export type MaterialMovementInput = z.infer<typeof materialMovementSchema>;
