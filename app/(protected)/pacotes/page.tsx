import { createClient } from '@/lib/supabase/server';
import { PackageManager } from '@/components/packages/package-manager';
import { listPackages } from '@/services/packages';
import type { Package } from '@/types/database';

export default async function PackagesPage() {
  const supabase = await createClient();
  let packages: Package[] = [];
  let error = '';

  try {
    packages = await listPackages(supabase);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Não foi possível carregar os pacotes.';
  }

  return <PackageManager initialPackages={packages} error={error} />;
}
