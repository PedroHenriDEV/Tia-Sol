import { z } from 'zod';

export const contractSchema = z.object({
  event_id: z.string().uuid().nullable(),
  client_id: z.string().uuid().nullable(),
  package_id: z.string().uuid().nullable(),
  status: z.enum(['rascunho', 'gerado', 'enviado', 'assinado', 'cancelado']),
  contractor_name: z.string().trim().min(2, 'Informe o nome do contratante.').max(180),
  contractor_document: z.string().trim().max(30).optional().or(z.literal('')),
  contractor_rg: z.string().trim().max(30).optional().or(z.literal('')),
  contractor_address: z.string().trim().max(300).optional().or(z.literal('')),
  contractor_phone: z.string().trim().max(40).optional().or(z.literal('')),
  contractor_email: z.string().trim().email('Informe um e-mail válido.').max(180).optional().or(z.literal('')),
  children_estimate: z.coerce.number().int().min(0).optional(),
  event_date: z.string().optional().or(z.literal('')),
  start_time: z.string().optional().or(z.literal('')),
  end_time: z.string().optional().or(z.literal('')),
  event_location: z.string().trim().max(300).optional().or(z.literal('')),
  event_location_type: z.string().trim().max(100).optional().or(z.literal('')),
  team_size: z.coerce.number().int().min(1, 'A equipe deve ter pelo menos 1 profissional.'),
  included_activities: z.array(z.string().trim().min(1).max(180)),
  included_equipment: z.array(z.string().trim().min(1).max(180)),
  total_amount: z.coerce.number().min(0),
  displacement_amount: z.coerce.number().min(0),
  deposit_amount: z.coerce.number().min(0),
  deposit_date: z.string().optional().or(z.literal('')),
  balance_amount: z.coerce.number().min(0),
  balance_due_date: z.string().optional().or(z.literal('')),
  payment_method: z.string().trim().max(100).optional().or(z.literal('')),
  pix_key: z.string().trim().max(180).optional().or(z.literal('')),
  additional_payment_terms: z.string().trim().max(1500).optional().or(z.literal('')),
  catering_required: z.boolean(),
  image_authorized: z.boolean(),
  additional_observations: z.string().trim().max(5000).optional().or(z.literal('')),
  contract_details: z.string().trim().max(5000).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.deposit_amount > data.total_amount) ctx.addIssue({ code: 'custom', path: ['deposit_amount'], message: 'O sinal não pode ser maior que o valor total.' });
  if (data.balance_amount > data.total_amount) ctx.addIssue({ code: 'custom', path: ['balance_amount'], message: 'O saldo não pode ser maior que o valor total.' });
});

export type ContractInput = z.infer<typeof contractSchema>;