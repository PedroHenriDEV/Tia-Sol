import { listClients } from '@/services/clients';
import { createClient } from '@/lib/supabase/server';
import { ClientManager } from '@/components/clients/client-manager';

export default async function ClientesPage() {
  const supabase = await createClient();
  const clients = await listClients(supabase);

  return <ClientManager initialClients={clients} />;
}