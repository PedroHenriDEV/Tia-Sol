import { z } from 'zod';

const optionalText = z.string().trim().max(500).optional().or(z.literal(''));
export const companySchema = z.object({
  legal_name: z.string().trim().min(2, 'Informe o nome da empresa.').max(160),
  trade_name: z.string().trim().max(160).optional().or(z.literal('')),
  tax_id: z.string().trim().max(18).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  whatsapp: z.string().trim().max(20).optional().or(z.literal('')),
  email: z.string().trim().email('Informe um e-mail válido.').optional().or(z.literal('')),
  address: z.string().trim().max(240).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  state: z.string().trim().max(2).optional().or(z.literal('')),
  description: optionalText,
  contract_details: z.string().trim().max(4000).optional().or(z.literal('')),
  bank_details: z.string().trim().max(2000).optional().or(z.literal('')),
  pix_key: z.string().trim().max(160).optional().or(z.literal('')),
});
export type CompanyInput = z.infer<typeof companySchema>;
