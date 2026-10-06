import { z } from 'zod';

export const packageSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do pacote.').max(120),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  price: z.string().trim().min(1, 'Informe o valor do pacote.').transform(Number)
    .pipe(z.number().finite().min(0, 'O valor deve ser maior ou igual a zero.')),
  duration: z.string().trim().min(1, 'Informe a duração do pacote.').transform(Number)
    .pipe(z.number().finite().int('A duração deve ser um número inteiro.').min(1, 'A duração deve ser maior que zero.')),
  activities: z.array(z.string().trim().min(1, 'Atividade inválida.').max(80)).min(1, 'Adicione pelo menos uma atividade.'),
  notes: z.string().trim().max(1500).optional().or(z.literal('')),
  active: z.boolean().default(true),
});

export type PackageInput = z.infer<typeof packageSchema>;
