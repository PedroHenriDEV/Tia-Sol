import { z } from 'zod';

export const eventStatuses = [
  'orcamento',
  'aguardando_confirmacao',
  'confirmado',
  'contrato_gerado',
  'contrato_assinado',
  'pagamento_parcial',
  'pagamento_completo',
  'realizado',
  'finalizado',
  'cancelado',
] as const;

export const eventSchema = z.object({
  title: z.string().trim().min(2, 'Informe o nome do evento.').max(180),
  client_id: z.string().uuid('Selecione um cliente.').nullable(),
  package_id: z.string().uuid().nullable(),
  event_date: z.string().min(1, 'Informe a data do evento.'),
  start_time: z.string().min(1, 'Informe o horário de início.'),
  end_time: z.string().min(1, 'Informe o horário de término.'),
  location: z.string().trim().max(300).optional().or(z.literal('')),
  status: z.enum(eventStatuses),
  total_amount: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
  received_amount: z.coerce.number().min(0, 'O valor recebido não pode ser negativo.'),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.end_time <= data.start_time) {
    ctx.addIssue({ code: 'custom', path: ['end_time'], message: 'O horário final deve ser depois do início.' });
  }
  if (data.received_amount > data.total_amount) {
    ctx.addIssue({ code: 'custom', path: ['received_amount'], message: 'O valor recebido não pode ser maior que o total.' });
  }
});
export type EventInput = z.infer<typeof eventSchema>;