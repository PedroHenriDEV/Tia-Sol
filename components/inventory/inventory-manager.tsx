'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Boxes, CircleAlert, CircleCheck, MapPin, Package, Pencil, Plus, Search, Wallet, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Material, MaterialMovement } from '@/types/inventory';
import type { EventRecord } from '@/types/event';
import { createMaterial, registerMaterialMovement, updateMaterial } from '@/services/inventory';

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const emptyMaterial = { name: '', category: 'Geral', unit: 'unidade', minimum_quantity: '0', unit_cost: '0', location: '', notes: '' };
const emptyMovement = { material_id: '', event_id: '', type: 'entrada' as 'entrada' | 'saida', quantity: '', unit_cost: '', reason: '' };

export function InventoryManager({ initialMaterials, initialMovements, events }: { initialMaterials: Material[]; initialMovements: MaterialMovement[]; events: Pick<EventRecord, 'id' | 'title'>[] }) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [movements, setMovements] = useState(initialMovements);
  const [search, setSearch] = useState('');
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [editing, setEditing] = useState<Material | null>(null);
  const [modal, setModal] = useState<'material' | 'movement' | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = useMemo(() => materials.filter(m => m.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) || m.category.toLocaleLowerCase().includes(search.toLocaleLowerCase())), [materials, search]);
  const low = materials.filter(m => m.quantity <= m.minimum_quantity).length;
  const empty = materials.filter(m => m.quantity === 0).length;
  const stockValue = materials.reduce((sum, m) => sum + Number(m.quantity) * Number(m.unit_cost), 0);
  const totalUnits = materials.reduce((sum, m) => sum + Number(m.quantity), 0);
  const attention = materials.filter(m => Number(m.quantity) <= Number(m.minimum_quantity)).sort((a, b) => Number(a.quantity) - Number(b.quantity));

  function openMaterial(item?: Material) {
    setEditing(item ?? null);
    setMaterialForm(item ? { name: item.name, category: item.category, unit: item.unit, minimum_quantity: String(item.minimum_quantity), unit_cost: String(item.unit_cost), location: item.location ?? '', notes: item.notes ?? '' } : emptyMaterial);
    setFeedback(null);
    setModal('material');
  }

  function openMovement(type: 'entrada' | 'saida' = 'entrada') {
    setMovementForm({ ...emptyMovement, type, material_id: materials[0]?.id ?? '' });
    setFeedback(null);
    setModal('movement');
  }

  async function saveMaterial(e: FormEvent) {
    e.preventDefault();
    if (!materialForm.name.trim()) { setFeedback('Informe o nome do material.'); return; }
    setSaving(true); setFeedback(null);
    try {
      const input = { ...materialForm, minimum_quantity: Number(materialForm.minimum_quantity), unit_cost: Number(materialForm.unit_cost) };
      const saved = editing ? await updateMaterial(createClient(), editing.id, input) : await createMaterial(createClient(), input);
      setMaterials(current => editing ? current.map(m => m.id === saved.id ? saved : m) : [...current, saved].sort((a,b) => a.name.localeCompare(b.name)));
      setModal(null);
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }

  async function saveMovement(e: FormEvent) {
    e.preventDefault();
    if (!movementForm.material_id || !movementForm.quantity || !movementForm.reason.trim()) { setFeedback('Preencha material, quantidade e motivo.'); return; }
    setSaving(true); setFeedback(null);
    try {
      const input = { material_id: movementForm.material_id, event_id: movementForm.event_id || null, type: movementForm.type, quantity: Number(movementForm.quantity), unit_cost: movementForm.unit_cost ? Number(movementForm.unit_cost) : null, reason: movementForm.reason };
      const saved = await registerMaterialMovement(createClient(), input);
      setMovements(current => [saved, ...current]);
      const delta = input.type === 'entrada' ? input.quantity : -input.quantity;
      setMaterials(current => current.map(m => m.id === input.material_id ? { ...m, quantity: Number(m.quantity) + delta } : m));
      setModal(null);
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Não foi possível registrar a movimentação.'); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi icon={<Boxes size={19} />} label="Materiais cadastrados" value={String(materials.length)} helper="Tipos de itens ativos" />
      <Kpi icon={<CircleAlert size={19} />} label="Precisam de reposição" value={String(attention.length)} helper="Abaixo ou no estoque mínimo" />
      <Kpi icon={<Package size={19} />} label="Quantidade disponível" value={totalUnits.toLocaleString("pt-BR")} helper="Soma das unidades" />
      <Kpi icon={<Wallet size={19} />} label="Valor atual do estoque" value={money(stockValue)} helper="Quantidade × custo unitário" />
    </div>

    <section className="surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="section-label">ESTOQUE</p><h2 className="display-title mt-1 text-2xl">Materiais</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Controle o que a Tia Sol tem disponível antes e depois de cada festa.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => openMovement('saida')} className="button-secondary"><ArrowUpFromLine size={16}/> Registrar saída</button>
          <button onClick={() => openMovement('entrada')} className="button-primary"><ArrowDownToLine size={16}/> Entrada de material</button>
          <button onClick={() => openMaterial()} className="button-secondary" data-tone="yellow"><Plus size={16}/> Novo material</button>
        </div>
      </div>
      <div className="relative mt-5 max-w-md"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"/><input className="input pl-10" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar material ou categoria..." /></div>
    </section>

    <section className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><div className="surface p-5 sm:p-6"><p className="section-label">REPOSIÇÃO</p><h2 className="mt-1 text-lg font-semibold">O que precisa ser comprado?</h2><p className="mt-1 text-xs text-[var(--muted)]">Materiais abaixo do mínimo e quanto falta.</p><div className="mt-4 space-y-3">{attention.slice(0,5).map(item => { const q=Number(item.quantity), min=Number(item.minimum_quantity), missing=Math.max(min-q,0); return <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] p-3"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{q.toLocaleString("pt-BR")} {item.unit} disponíveis · mínimo {min.toLocaleString("pt-BR")}</p></div><div className="text-right"><span className={q===0?"status-badge status-danger":"status-badge status-warning"}>{q===0?"Zerado":"Baixo"}</span><p className="mt-1 text-[10px] text-[var(--muted)]">faltam {missing.toLocaleString("pt-BR")} {item.unit}</p></div></div> })}{!attention.length&&<div className="flex items-center gap-2 rounded-2xl bg-[var(--success-soft)] p-3 text-sm text-[var(--success)]"><CircleCheck size={18}/>Estoque dentro do mínimo.</div>}</div></div><div className="surface p-5 sm:p-6"><p className="section-label">RESUMO</p><h2 className="mt-1 text-lg font-semibold">Situação atual</h2><div className="mt-4 space-y-3 text-sm"><p className="flex justify-between"><span className="text-[var(--muted-foreground)]">Zerados</span><strong>{empty}</strong></p><p className="flex justify-between"><span className="text-[var(--muted-foreground)]">Estoque baixo</span><strong>{low}</strong></p><p className="flex justify-between"><span className="text-[var(--muted-foreground)]">Quantidade total</span><strong>{totalUnits.toLocaleString("pt-BR")}</strong></p><p className="flex justify-between border-t border-[var(--border)] pt-3"><span className="font-medium">Valor estimado</span><strong>{money(stockValue)}</strong></p></div></div></section>

    <section className="surface overflow-hidden">
      <div className="hidden grid-cols-[minmax(0,1.7fr)_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-[var(--border)] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] md:grid"><span>Material</span><span>Categoria</span><span>Quantidade</span><span>Mínimo</span><span>Valor</span><span/></div>
      <div className="divide-y divide-[var(--border)]">
        {filtered.map(item => <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1.7fr)_1fr_1fr_1fr_1fr_auto] md:items-center md:gap-4 md:px-5">
          <div><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.location ? <><MapPin size={12} className="mr-1 inline"/> {item.location} · </> : ''}{item.unit}</p></div>
          <p className="text-sm text-[var(--muted-foreground)]">{item.category}</p>
          <p className="font-bold">{Number(item.quantity).toLocaleString('pt-BR')} <span className="text-xs font-normal text-[var(--muted)]">{item.unit}</span></p>
          <p className="text-sm text-[var(--muted-foreground)]">{Number(item.minimum_quantity).toLocaleString('pt-BR')}</p>
          <p className="text-sm font-semibold">{money(Number(item.quantity) * Number(item.unit_cost))}</p>
          <button title="Editar material" onClick={() => openMaterial(item)} className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"><Pencil size={16}/></button>
        </div>)}
        {!filtered.length && <div className="px-6 py-12 text-center text-sm text-[var(--muted)]">Nenhum material encontrado.</div>}
      </div>
    </section>

    <section className="surface overflow-hidden">
      <div className="border-b border-[var(--border)] px-5 py-4"><h2 className="font-semibold">Últimas movimentações</h2><p className="mt-1 text-xs text-[var(--muted)]">Entradas e saídas registradas no estoque.</p></div>
      <div className="divide-y divide-[var(--border)]">{movements.slice(0, 10).map(m => { const material = materials.find(x => x.id === m.material_id); const event = events.find(x => x.id === m.event_id); return <div key={m.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:px-5"><span className={'grid h-9 w-9 shrink-0 place-items-center rounded-xl ' + (m.type === 'entrada' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--danger-soft)] text-[var(--danger)]')}>{m.type === 'entrada' ? <ArrowDownToLine size={17}/> : <ArrowUpFromLine size={17}/>}</span><div className="min-w-0 flex-1"><p className="font-semibold">{material?.name ?? 'Material'}</p><p className="text-xs text-[var(--muted-foreground)]">{m.reason}{event ? ' · ' + event.title : ''}</p></div><p className="font-bold">{m.type === 'entrada' ? '+' : '−'}{Number(m.quantity).toLocaleString('pt-BR')} {material?.unit ?? ''}</p></div> })}</div>
    </section>

    {modal === 'material' && <Modal title={editing ? 'Editar material' : 'Novo material'} onClose={() => setModal(null)}><form onSubmit={saveMaterial} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome *" className="sm:col-span-2"><input className="input" value={materialForm.name} onChange={e=>setMaterialForm(f=>({...f,name:e.target.value}))} placeholder="Ex.: Balões coloridos"/></Field>
      <Field label="Categoria"><input className="input" value={materialForm.category} onChange={e=>setMaterialForm(f=>({...f,category:e.target.value}))}/></Field>
      <Field label="Unidade"><input className="input" value={materialForm.unit} onChange={e=>setMaterialForm(f=>({...f,unit:e.target.value}))} placeholder="unidade, caixa, pacote..."/></Field>
      <Field label="Estoque mínimo"><input type="number" min="0" step="0.01" className="input" value={materialForm.minimum_quantity} onChange={e=>setMaterialForm(f=>({...f,minimum_quantity:e.target.value}))}/></Field>
      <Field label="Custo unitário"><input type="number" min="0" step="0.01" className="input" value={materialForm.unit_cost} onChange={e=>setMaterialForm(f=>({...f,unit_cost:e.target.value}))}/></Field>
      <Field label="Local"><input className="input" value={materialForm.location} onChange={e=>setMaterialForm(f=>({...f,location:e.target.value}))} placeholder="Armário, depósito..."/></Field>
      <Field label="Observações" className="sm:col-span-2"><textarea className="input h-auto py-3" rows={3} value={materialForm.notes} onChange={e=>setMaterialForm(f=>({...f,notes:e.target.value}))}/></Field>
      {feedback && <p className="feedback-error sm:col-span-2">{feedback}</p>}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={()=>setModal(null)} className="button-secondary">Cancelar</button><button disabled={saving} className="button-primary">{saving?'Salvando...':editing?'Salvar alterações':'Cadastrar material'}</button></div>
    </form></Modal>}

    {modal === 'movement' && <Modal title={movementForm.type === 'entrada' ? 'Entrada de material' : 'Saída de material'} onClose={() => setModal(null)}><form onSubmit={saveMovement} className="grid gap-4 sm:grid-cols-2">
      <Field label="Tipo"><select className="input" value={movementForm.type} onChange={e=>setMovementForm(f=>({...f,type:e.target.value as 'entrada'|'saida'}))}><option value="entrada">Entrada</option><option value="saida">Saída / Uso</option></select></Field>
      <Field label="Material"><select className="input" value={movementForm.material_id} onChange={e=>setMovementForm(f=>({...f,material_id:e.target.value}))}>{materials.map(m=><option key={m.id} value={m.id}>{m.name} — {m.quantity} {m.unit}</option>)}</select></Field>
      <Field label="Quantidade *"><input type="number" min="0.01" step="0.01" className="input" value={movementForm.quantity} onChange={e=>setMovementForm(f=>({...f,quantity:e.target.value}))}/></Field>
      <Field label="Custo unitário"><input type="number" min="0" step="0.01" className="input" value={movementForm.unit_cost} onChange={e=>setMovementForm(f=>({...f,unit_cost:e.target.value}))}/></Field>
      <Field label="Evento relacionado"><select className="input" value={movementForm.event_id} onChange={e=>setMovementForm(f=>({...f,event_id:e.target.value}))}><option value="">Nenhum</option>{events.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></Field>
      <Field label="Motivo *" className="sm:col-span-2"><input className="input" value={movementForm.reason} onChange={e=>setMovementForm(f=>({...f,reason:e.target.value}))} placeholder="Ex.: compra, uso na festa, reposição..."/></Field>
      {feedback && <p className="feedback-error sm:col-span-2">{feedback}</p>}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={()=>setModal(null)} className="button-secondary">Cancelar</button><button disabled={saving} className="button-primary">{saving?'Registrando...':'Registrar movimentação'}</button></div>
    </form></Modal>}
  </div>;
}

function Field({label,children,className=''}:{label:string;children:ReactNode;className?:string}) { return <label className={'space-y-1.5 '+className}><span className="text-sm font-medium">{label}</span>{children}</label>; }
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}) { return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 sm:items-center sm:p-5"><div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="section-label">MATERIAIS & ESTOQUE</p><h2 className="display-title mt-1 text-2xl">{title}</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--background)]"><X size={19}/></button></div><div className="mt-6">{children}</div></div></div>}
function Kpi({icon,label,value,helper}:{icon:ReactNode;label:string;value:string;helper:string}) { return <section className="surface p-5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</div><p className="mt-4 text-xs font-semibold text-[var(--muted)]">{label}</p><p className="mt-1 text-xl font-bold">{value}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{helper}</p></section>; }
