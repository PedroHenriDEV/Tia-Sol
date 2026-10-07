import { createClient } from '@/lib/supabase/server';
import { ContractManager } from '@/components/contracts/contract-manager';
import { listContracts } from '@/services/contracts';
import { listEvents } from '@/services/events';
import { listClients } from '@/services/clients';
import { listPackages } from '@/services/packages';
import { getMyCompany } from '@/services/company';
import type { ContractRecord } from '@/types/contract';
import type { EventRecord } from '@/types/event';
import type { Client, Package, Company } from '@/types/database';

export default async function ContractsPage() {
  const supabase = await createClient();
  const [contracts, events, clients, packages, company] = await Promise.all([
    listContracts(supabase).catch(() => [] as ContractRecord[]),
    listEvents(supabase).catch(() => [] as EventRecord[]),
    listClients(supabase).catch(() => [] as Client[]),
    listPackages(supabase).catch(() => [] as Package[]),
    getMyCompany(supabase).catch(() => null as Company | null),
  ]);

  return <ContractManager initialContracts={contracts} events={events} clients={clients} packages={packages} company={company} />;
}
