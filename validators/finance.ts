import { z } from 'zod';

export const financialSchema = z.object({
  type: z.enum(['receita', 'despesa']),
  event_id: z.string().uuid().nullable(),
  description: z.string().trim().min(2, 'Informe a descrição.').max(180),
  category: z.string().trim().min(2, 'Informe a categoria.').max(100),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  due_date: z.string().min(1, 'Informe a data.'),
  paid_at: z.string().nullable(),
  status: z.enum(['pendente', 'pago', 'cancelado']),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type FinancialInput = z.infer<typeof financialSchema>;
