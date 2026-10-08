import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do cliente.').max(160),
  document: z.string().trim().max(30).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  whatsapp: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.string().trim().email('Informe um e-mail válido.').max(160).optional().or(z.literal('')),
  address: z.string().trim().max(240).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  state: z.string().trim().length(2, 'Use a sigla do estado com 2 letras.').optional().or(z.literal('')),
  notes: z.string().trim().max(1500).optional().or(z.literal('')),
  active: z.boolean().default(true),
});
export type ClientInput = z.infer<typeof clientSchema>;