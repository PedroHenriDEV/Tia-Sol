import { listClients } from '@/services/clients';
import { listPackages } from '@/services/packages';
import { listEvents } from '@/services/events';
import { createClient } from '@/lib/supabase/server';
import { AgendaView } from '@/components/agenda/agenda-view';

export default async function AgendaPage() {
  const supabase = await createClient();
  const [events, clients, packages] = await Promise.all([
    listEvents(supabase),
    listClients(supabase),
    listPackages(supabase),
  ]);

  return <AgendaView initialEvents={events} clients={clients} packages={packages} />;
}