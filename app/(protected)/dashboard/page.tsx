import { Dashboard } from '@/components/dashboard/dashboard';
import { listEvents } from '@/services/events';
import { listClients } from '@/services/clients';
import { listPackages } from '@/services/packages';
import { listFinancialTransactions } from '@/services/finance';
import { listMaterials } from '@/services/inventory';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const [events, clients, packages, transactions, materials] = await Promise.all([
    listEvents(supabase).catch(() => []),
    listClients(supabase).catch(() => []),
    listPackages(supabase).catch(() => []),
    listFinancialTransactions(supabase).catch(() => []),
    listMaterials(supabase).catch(() => []),
  ]);
  return <Dashboard events={events} clients={clients} packages={packages} transactions={transactions} materials={materials} />;
}
