import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEventById } from '@/services/events';
import { listContracts } from '@/services/contracts';
import { listMaterials, listMaterialMovements } from '@/services/inventory';
import { listFinancialTransactions } from '@/services/finance';
import { EventCentral } from '@/components/events/event-central';

export default async function EventCentralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [event, contracts, materials, movements, transactions] = await Promise.all([
    getEventById(supabase, id),
    listContracts(supabase).catch(() => []),
    listMaterials(supabase).catch(() => []),
    listMaterialMovements(supabase, id).catch(() => []),
    listFinancialTransactions(supabase).catch(() => []),
  ]);

  if (!event) notFound();

  const payments = transactions
    .filter((transaction) => transaction.event_id === id && transaction.type === 'receita' && transaction.status === 'pago')
    .sort((a, b) => (b.paid_at ?? b.due_date).localeCompare(a.paid_at ?? a.due_date));

  return <EventCentral event={event} contracts={contracts.filter((contract) => contract.event_id === id)} materials={materials} movements={movements} payments={payments} />;
}
