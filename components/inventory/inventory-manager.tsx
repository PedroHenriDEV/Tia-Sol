'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  History,
  MapPin,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Wallet,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Material, MaterialMovement } from '@/types/inventory';
import type { EventRecord } from '@/types/event';
import { createMaterial, registerMaterialMovement, updateMaterial } from '@/services/inventory';

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const number = (value: number) => Number(value || 0).toLocaleString('pt-BR');

const emptyMaterial = {
  name: '',
  category: 'Geral',
  unit: 'unidade',
  minimum_quantity: '0',
  unit_cost: '0',
  location: '',
  notes: '',
};

const emptyMovement = {
  material_id: '',
  event_id: '',
  type: 'entrada' as 'entrada' | 'saida',
  quantity: '',
  unit_cost: '',
  reason: '',
};

type Tab = 'visao' | 'materiais' | 'compras' | 'festas' | 'historico';

export function InventoryManager({
  initialMaterials,
  initialMovements,
  events,
}: {
  initialMaterials: Material[];
  initialMovements: MaterialMovement[];
  events: Pick<EventRecord, 'id' | 'title'>[];
}) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [movements, setMovements] = useState(initialMovements);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('visao');
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [editing, setEditing] = useState<Material | null>(null);
  const [modal, setModal] = useState<'material' | 'movement' | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = materials.length;
    const available = materials.reduce((sum, item) => sum + Number(item.quantity), 0);
    const zero = materials.filter((item) => Number(item.quantity) === 0).length;
    const low = materials.filter(
      (item) => Number(item.quantity) > 0 && Number(item.quantity) <= Number(item.minimum_quantity),
    ).length;
    const needsPurchase = materials.filter(
      (item) => Number(item.quantity) < Number(item.minimum_quantity),
    );
    const value = materials.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_cost),
      0,
    );

    return { total, available, zero, low, needsPurchase, value };
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return materials;
    return materials.filter((item) =>
      [item.name, item.category, item.location ?? '', item.unit]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [materials, search]);

  const purchaseList = useMemo(
    () =>
      [...stats.needsPurchase].sort(
        (a, b) =>
          Number(a.quantity) - Number(a.minimum_quantity) -
          (Number(b.quantity) - Number(b.minimum_quantity)),
      ),
    [stats.needsPurchase],
  );

  const eventUsage = useMemo(() => {
    const grouped = new Map<string, { title: string; movements: MaterialMovement[] }>();

    movements
      .filter((movement) => movement.type === 'saida' && movement.event_id)
      .forEach((movement) => {
        const event = events.find((item) => item.id === movement.event_id);
        if (!event) return;

        const existing = grouped.get(event.id) ?? { title: event.title, movements: [] };
        existing.movements.push(movement);
        grouped.set(event.id, existing);
      });

    return Array.from(grouped.values());
  }, [events, movements]);

  function openMaterial(item?: Material) {
    setEditing(item ?? null);
    setMaterialForm(
      item
        ? {
            name: item.name,
            category: item.category,
            unit: item.unit,
            minimum_quantity: String(item.minimum_quantity),
            unit_cost: String(item.unit_cost),
            location: item.location ?? '',
            notes: item.notes ?? '',
          }
        : emptyMaterial,
    );
    setFeedback(null);
    setModal('material');
  }

  function openMovement(type: 'entrada' | 'saida' = 'entrada', materialId = '') {
    setMovementForm({
      ...emptyMovement,
      type,
      material_id: materialId || materials[0]?.id || '',
    });
    setFeedback(null);
    setModal('movement');
  }

  async function saveMaterial(event: FormEvent) {
    event.preventDefault();
    if (!materialForm.name.trim()) {
      setFeedback('Informe o nome do material.');
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const input = {
        ...materialForm,
        minimum_quantity: Number(materialForm.minimum_quantity),
        unit_cost: Number(materialForm.unit_cost),
      };

      const saved = editing
        ? await updateMaterial(createClient(), editing.id, input)
        : await createMaterial(createClient(), input);

      setMaterials((current) =>
        editing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setModal(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function saveMovement(event: FormEvent) {
    event.preventDefault();

    if (!movementForm.material_id || !movementForm.quantity || !movementForm.reason.trim()) {
      setFeedback('Preencha material, quantidade e motivo.');
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const input = {
        material_id: movementForm.material_id,
        event_id: movementForm.event_id || null,
        type: movementForm.type,
        quantity: Number(movementForm.quantity),
        unit_cost: movementForm.unit_cost ? Number(movementForm.unit_cost) : null,
        reason: movementForm.reason,
      };

      const saved = await registerMaterialMovement(createClient(), input);

      setMovements((current) => [saved, ...current]);

      const delta = input.type === 'entrada' ? input.quantity : -input.quantity;
      setMaterials((current) =>
        current.map((item) =>
          item.id === input.material_id
            ? { ...item, quantity: Number(item.quantity) + delta }
            : item,
        ),
      );

      setModal(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível registrar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="surface overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">MATERIAIS & ESTOQUE</p>
            <h1 className="display-title mt-1 text-3xl sm:text-4xl">Controle de materiais</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              Saiba rapidamente o que a Tia Sol tem, o que está faltando, o que precisa comprar e
              o que foi usado em cada festa.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={() => openMovement('saida')} className="button-secondary">
              <ArrowUpFromLine size={16} /> Registrar uso
            </button>
            <button onClick={() => openMovement('entrada')} className="button-primary">
              <ArrowDownToLine size={16} /> Registrar entrada
            </button>
            <button onClick={() => openMaterial()} className="button-secondary" data-tone="yellow">
              <Plus size={16} /> Novo material
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard icon={<Boxes size={18} />} label="Materiais" value={number(stats.total)} />
          <SummaryCard icon={<Package size={18} />} label="Disponível" value={number(stats.available)} />
          <SummaryCard
            icon={<CircleAlert size={18} />}
            label="Precisam comprar"
            value={number(stats.needsPurchase.length)}
            alert={stats.needsPurchase.length > 0}
          />
          <SummaryCard icon={<Wallet size={18} />} label="Valor em estoque" value={money(stats.value)} />
        </div>
      </header>

      <nav className="surface flex gap-1 overflow-x-auto p-1.5" aria-label="Seções do estoque">
        {[
          ['visao', 'Visão geral'],
          ['materiais', 'O que tenho'],
          ['compras', 'O que comprar'],
          ['festas', 'Uso por festa'],
          ['historico', 'Movimentações'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value as Tab)}
            className={
              tab === value
                ? 'shrink-0 rounded-xl bg-[var(--primary-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--primary)]'
                : 'shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--background)]'
            }
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'visao' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="surface p-5 sm:p-6">
            <SectionTitle
              eyebrow="O QUE ESTÁ FALTANDO"
              title="Lista de reposição"
              description="Aqui aparecem os materiais abaixo do estoque mínimo."
            />
            <div className="mt-5 space-y-3">
              {purchaseList.slice(0, 8).map((item) => (
                <PurchaseRow
                  key={item.id}
                  item={item}
                  onEntry={() => openMovement('entrada', item.id)}
                />
              ))}
              {!purchaseList.length && (
                <EmptyState
                  icon={<CheckCircle2 size={20} />}
                  title="Nenhuma reposição pendente"
                  text="Todos os materiais estão no mínimo definido ou acima dele."
                  success
                />
              )}
            </div>
          </section>

          <section className="surface p-5 sm:p-6">
            <SectionTitle
              eyebrow="SITUAÇÃO"
              title="Estoque agora"
              description="Um resumo para decidir o que fazer antes da próxima festa."
            />
            <div className="mt-5 divide-y divide-[var(--border)]">
              <MetricRow label="Materiais cadastrados" value={number(stats.total)} />
              <MetricRow label="Materiais zerados" value={number(stats.zero)} danger={stats.zero > 0} />
              <MetricRow label="Materiais baixos" value={number(stats.low)} warning={stats.low > 0} />
              <MetricRow label="Quantidade disponível" value={number(stats.available)} />
              <MetricRow label="Valor estimado" value={money(stats.value)} strong />
            </div>
          </section>

          <section className="surface p-5 sm:p-6 lg:col-span-2">
            <SectionTitle
              eyebrow="ATIVIDADE RECENTE"
              title="Últimas movimentações"
              description="Entradas e saídas registradas recentemente."
            />
            <MovementList movements={movements.slice(0, 6)} materials={materials} events={events} />
          </section>
        </div>
      )}

      {tab === 'materiais' && (
        <section className="surface overflow-hidden">
          <div className="border-b border-[var(--border)] p-5 sm:p-6">
            <SectionTitle
              eyebrow="INVENTÁRIO"
              title="O que eu tenho?"
              description="Todos os materiais disponíveis, com localização e quantidade atual."
            />
            <div className="relative mt-5 max-w-xl">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                className="input pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por material, categoria ou local..."
              />
            </div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {filteredMaterials.map((item) => {
              const quantity = Number(item.quantity);
              const minimum = Number(item.minimum_quantity);
              const status =
                quantity === 0 ? 'Zerado' : quantity < minimum ? 'Baixo' : 'OK';

              return (
                <div
                  key={item.id}
                  className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.5fr)_1fr_1fr_1fr_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.name}</p>
                      <StatusBadge status={status} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {item.category}
                      {item.location ? (
                        <>
                          {' · '}
                          <MapPin size={12} className="inline" /> {item.location}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Tenho
                    </p>
                    <p className="mt-1 font-bold">
                      {number(quantity)} <span className="text-xs font-normal">{item.unit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Mínimo
                    </p>
                    <p className="mt-1 text-sm">{number(minimum)} {item.unit}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Valor
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {money(quantity * Number(item.unit_cost))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {quantity < minimum && (
                      <button
                        type="button"
                        onClick={() => openMovement('entrada', item.id)}
                        className="button-secondary"
                      >
                        <ShoppingCart size={15} /> Repor
                      </button>
                    )}
                    <button
                      type="button"
                      title="Editar material"
                      onClick={() => openMaterial(item)}
                      className="rounded-xl border border-[var(--border)] p-2.5 text-[var(--muted-foreground)] hover:bg-[var(--background)]"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            {!filteredMaterials.length && (
              <EmptyState
                icon={<Package size={20} />}
                title="Nenhum material encontrado"
                text="Cadastre um material ou altere a busca."
              />
            )}
          </div>
        </section>
      )}

      {tab === 'compras' && (
        <section className="surface p-5 sm:p-6">
          <SectionTitle
            eyebrow="COMPRAS"
            title="O que preciso comprar?"
            description="A lista é calculada usando o estoque atual e o mínimo de cada material."
          />
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)]">
            <div className="hidden grid-cols-[minmax(0,1.6fr)_1fr_1fr_1fr_auto] gap-4 border-b border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] sm:grid">
              <span>Material</span>
              <span>Tenho</span>
              <span>Mínimo</span>
              <span>Falta</span>
              <span />
            </div>
            {purchaseList.map((item) => {
              const missing = Math.max(Number(item.minimum_quantity) - Number(item.quantity), 0);
              return (
                <div
                  key={item.id}
                  className="grid gap-3 border-b border-[var(--border)] p-4 last:border-0 sm:grid-cols-[minmax(0,1.6fr)_1fr_1fr_1fr_auto] sm:items-center sm:gap-4"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.category}</p>
                  </div>
                  <p className="text-sm">{number(Number(item.quantity))} {item.unit}</p>
                  <p className="text-sm">{number(Number(item.minimum_quantity))} {item.unit}</p>
                  <p className="font-bold text-[var(--danger)]">{number(missing)} {item.unit}</p>
                  <button type="button" onClick={() => openMovement('entrada', item.id)} className="button-secondary">
                    <ArrowDownToLine size={15} /> Registrar compra
                  </button>
                </div>
              );
            })}
            {!purchaseList.length && (
              <EmptyState
                icon={<CheckCircle2 size={20} />}
                title="Lista de compras vazia"
                text="Não há materiais abaixo do mínimo."
                success
              />
            )}
          </div>
        </section>
      )}

      {tab === 'festas' && (
        <section className="surface p-5 sm:p-6">
          <SectionTitle
            eyebrow="USO POR FESTA"
            title="O que foi usado em cada festa?"
            description="As saídas vinculadas a um evento aparecem agrupadas aqui."
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {eventUsage.map((group) => (
              <article key={group.title} className="rounded-2xl border border-[var(--border)] p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--secondary-soft)] text-[var(--secondary)]">
                    <CalendarDays size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{group.title}</h3>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {group.movements.length} registro(s) de uso
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
                  {group.movements.map((movement) => {
                    const material = materials.find((item) => item.id === movement.material_id);
                    return (
                      <div key={movement.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium">{material?.name ?? 'Material'}</p>
                          <p className="truncate text-xs text-[var(--muted-foreground)]">{movement.reason}</p>
                        </div>
                        <strong className="shrink-0">
                          {number(Number(movement.quantity))} {material?.unit ?? ''}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
          {!eventUsage.length && (
            <EmptyState
              icon={<CalendarDays size={20} />}
              title="Nenhum uso vinculado a festas ainda"
              text="Ao registrar uma saída, selecione o evento para construir o histórico de uso por festa."
            />
          )}
        </section>
      )}

      {tab === 'historico' && (
        <section className="surface overflow-hidden">
          <div className="border-b border-[var(--border)] p-5 sm:p-6">
            <SectionTitle
              eyebrow="HISTÓRICO"
              title="Entradas e saídas"
              description="Tudo o que entrou ou saiu do estoque fica registrado."
            />
          </div>
          <MovementList movements={movements} materials={materials} events={events} detailed />
        </section>
      )}

      {modal === 'material' && (
        <Modal title={editing ? 'Editar material' : 'Novo material'} onClose={() => setModal(null)}>
          <form onSubmit={saveMaterial} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome *" className="sm:col-span-2">
              <input className="input" value={materialForm.name} onChange={(e) => setMaterialForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: Balões coloridos" />
            </Field>
            <Field label="Categoria">
              <input className="input" value={materialForm.category} onChange={(e) => setMaterialForm((f) => ({ ...f, category: e.target.value }))} />
            </Field>
            <Field label="Unidade">
              <input className="input" value={materialForm.unit} onChange={(e) => setMaterialForm((f) => ({ ...f, unit: e.target.value }))} placeholder="unidade, caixa, pacote..." />
            </Field>
            <Field label="Estoque mínimo">
              <input type="number" min="0" step="0.01" className="input" value={materialForm.minimum_quantity} onChange={(e) => setMaterialForm((f) => ({ ...f, minimum_quantity: e.target.value }))} />
            </Field>
            <Field label="Custo unitário">
              <input type="number" min="0" step="0.01" className="input" value={materialForm.unit_cost} onChange={(e) => setMaterialForm((f) => ({ ...f, unit_cost: e.target.value }))} />
            </Field>
            <Field label="Local">
              <input className="input" value={materialForm.location} onChange={(e) => setMaterialForm((f) => ({ ...f, location: e.target.value }))} placeholder="Armário, depósito..." />
            </Field>
            <Field label="Observações" className="sm:col-span-2">
              <textarea className="input h-auto py-3" rows={3} value={materialForm.notes} onChange={(e) => setMaterialForm((f) => ({ ...f, notes: e.target.value }))} />
            </Field>
            {feedback && <p className="feedback-error sm:col-span-2">{feedback}</p>}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModal(null)} className="button-secondary">Cancelar</button>
              <button disabled={saving} className="button-primary">{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar material'}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'movement' && (
        <Modal title={movementForm.type === 'entrada' ? 'Entrada de material' : 'Registrar uso / saída'} onClose={() => setModal(null)}>
          <form onSubmit={saveMovement} className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <select className="input" value={movementForm.type} onChange={(e) => setMovementForm((f) => ({ ...f, type: e.target.value as 'entrada' | 'saida' }))}>
                <option value="entrada">Entrada / compra</option>
                <option value="saida">Saída / uso</option>
              </select>
            </Field>
            <Field label="Material">
              <select className="input" value={movementForm.material_id} onChange={(e) => setMovementForm((f) => ({ ...f, material_id: e.target.value }))}>
                {materials.map((item) => <option key={item.id} value={item.id}>{item.name} — {number(Number(item.quantity))} {item.unit}</option>)}
              </select>
            </Field>
            <Field label="Quantidade *">
              <input type="number" min="0.01" step="0.01" className="input" value={movementForm.quantity} onChange={(e) => setMovementForm((f) => ({ ...f, quantity: e.target.value }))} />
            </Field>
            <Field label="Custo unitário">
              <input type="number" min="0" step="0.01" className="input" value={movementForm.unit_cost} onChange={(e) => setMovementForm((f) => ({ ...f, unit_cost: e.target.value }))} />
            </Field>
            <Field label="Evento relacionado">
              <select className="input" value={movementForm.event_id} onChange={(e) => setMovementForm((f) => ({ ...f, event_id: e.target.value }))}>
                <option value="">Nenhum</option>
                {events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </Field>
            <Field label="Motivo *" className="sm:col-span-2">
              <input className="input" value={movementForm.reason} onChange={(e) => setMovementForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Ex.: compra, uso na festa, reposição..." />
            </Field>
            {movementForm.type === 'saida' && (
              <div className="rounded-2xl bg-[var(--warning-soft)] p-3 text-xs leading-5 text-[var(--warning)] sm:col-span-2">
                Para registrar o consumo de uma festa, selecione o evento. Assim esse material ficará no histórico daquela festa.
              </div>
            )}
            {feedback && <p className="feedback-error sm:col-span-2">{feedback}</p>}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModal(null)} className="button-secondary">Cancelar</button>
              <button disabled={saving} className="button-primary">{saving ? 'Registrando...' : 'Registrar movimentação'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="section-label">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}

function SummaryCard({ icon, label, value, alert = false }: { icon: ReactNode; label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className={'grid h-9 w-9 place-items-center rounded-xl ' + (alert ? 'bg-[var(--warning-soft)] text-[var(--warning)]' : 'bg-white text-[var(--primary)]')}>
        {icon}
      </div>
      <p className="mt-3 text-xs font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate text-lg font-bold">{value}</p>
    </div>
  );
}

function MetricRow({ label, value, danger = false, warning = false, strong = false }: { label: string; value: string; danger?: boolean; warning?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <strong className={(danger ? 'text-[var(--danger)] ' : '') + (warning ? 'text-[var(--warning)] ' : '') + (strong ? 'text-base' : 'text-sm')}>{value}</strong>
    </div>
  );
}

function PurchaseRow({ item, onEntry }: { item: Material; onEntry: () => void }) {
  const quantity = Number(item.quantity);
  const minimum = Number(item.minimum_quantity);
  const missing = Math.max(minimum - quantity, 0);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{item.name}</p>
          <StatusBadge status={quantity === 0 ? 'Zerado' : 'Baixo'} />
        </div>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Tenho {number(quantity)} {item.unit} · mínimo {number(minimum)} {item.unit} · faltam {number(missing)} {item.unit}
        </p>
      </div>
      <button type="button" onClick={onEntry} className="button-secondary self-start sm:self-auto">
        <ShoppingCart size={15} /> Registrar compra
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === 'Zerado'
      ? 'status-badge status-danger'
      : status === 'Baixo'
        ? 'status-badge status-warning'
        : 'status-badge status-success';

  return <span className={classes}>{status}</span>;
}

function MovementList({
  movements,
  materials,
  events,
  detailed = false,
}: {
  movements: MaterialMovement[];
  materials: Material[];
  events: Pick<EventRecord, 'id' | 'title'>[];
  detailed?: boolean;
}) {
  if (!movements.length) {
    return <EmptyState icon={<History size={20} />} title="Nenhuma movimentação" text="As entradas e saídas aparecerão aqui." />;
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      {movements.map((movement) => {
        const material = materials.find((item) => item.id === movement.material_id);
        const event = events.find((item) => item.id === movement.event_id);

        return (
          <div key={movement.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
            <span className={'grid h-9 w-9 shrink-0 place-items-center rounded-xl ' + (movement.type === 'entrada' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--danger-soft)] text-[var(--danger)]')}>
              {movement.type === 'entrada' ? <ArrowDownToLine size={17} /> : <ArrowUpFromLine size={17} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{material?.name ?? 'Material'}</p>
                <span className="text-xs text-[var(--muted)]">{movement.type === 'entrada' ? 'Entrada' : 'Saída / uso'}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {movement.reason}
                {event ? <> · Festa: {event.title}</> : null}
                {detailed ? <> · {new Date(movement.created_at).toLocaleDateString('pt-BR')}</> : null}
              </p>
            </div>
            <p className={'shrink-0 font-bold ' + (movement.type === 'entrada' ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
              {movement.type === 'entrada' ? '+' : '−'}{number(Number(movement.quantity))} {material?.unit ?? ''}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ icon, title, text, success = false }: { icon: ReactNode; title: string; text: string; success?: boolean }) {
  return (
    <div className={'rounded-2xl p-6 text-center ' + (success ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--background)] text-[var(--muted-foreground)]'}>
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white">{icon}</div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs">{text}</p>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <label className={'space-y-1.5 ' + className}><span className="text-sm font-medium">{label}</span>{children}</label>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 sm:items-center sm:p-5">
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label">MATERIAIS & ESTOQUE</p>
            <h2 className="display-title mt-1 text-2xl">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--background)]">
            <X size={19} />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
