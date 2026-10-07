import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEventById } from '@/services/events';
import { listContracts } from '@/services/contracts';
import { listMaterials, listMaterialMovements } from '@/services/inventory';
import { EventCentral } from '@/components/events/event-central';

export default async function EventCentralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [event, contracts, materials, movements] = await Promise.all([
    getEventById(supabase, id),
    listContracts(supabase).catch(() => []),
    listMaterials(supabase).catch(() => []),
    listMaterialMovements(supabase, id).catch(() => []),
  ]);

  if (!event) notFound();

  return <EventCentral event={event} contracts={contracts.filter((contract) => contract.event_id === id)} materials={materials} movements={movements} />;
}
