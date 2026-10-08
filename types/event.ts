import type { Client, Package } from '@/types/database';

export const EVENT_STATUSES = [
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

export type EventStatus = (typeof EVENT_STATUSES)[number];

export type EventRecord = {
  id: string;
  company_id: string;
  client_id: string | null;
  package_id: string | null;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: EventStatus;
  total_amount: number;
  received_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client | null;
  package?: Package | null;
};