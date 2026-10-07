import { createClient } from '@/lib/supabase/server';
import { listEvents } from '@/services/events';
import { listMaterials, listMaterialMovements } from '@/services/inventory';
import { InventoryManager } from '@/components/inventory/inventory-manager';

export default async function EstoquePage() {
  const supabase = await createClient();
  const [materials, movements, events] = await Promise.all([
    listMaterials(supabase),
    listMaterialMovements(supabase),
    listEvents(supabase),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="section-label">ESTRUTURA</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          Materiais & Estoque
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Saiba exatamente o que está disponível para as próximas festas.
        </p>
      </div>
      <InventoryManager
        initialMaterials={materials}
        initialMovements={movements}
        events={events.map((event) => ({ id: event.id, title: event.title }))}
      />
    </div>
  );
}
