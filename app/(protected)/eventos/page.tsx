import { listClients } from '@/services/clients';
import { listPackages } from '@/services/packages';
import { listEvents } from '@/services/events';
import { createClient } from '@/lib/supabase/server';
import { EventManager } from '@/components/events/event-manager';

export default async function EventosPage() {
  const supabase = await createClient();
  const [events, clients, packages] = await Promise.all([
    listEvents(supabase),
    listClients(supabase),
    listPackages(supabase),
  ]);

  return <EventManager initialEvents={events} clients={clients} packages={packages} />;
}
