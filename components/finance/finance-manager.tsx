'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDownCircle, ArrowUpCircle, CalendarDays, FileText, Pencil, Plus, Printer, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { FinancialStatus, FinancialTransaction, FinancialType } from '@/types/finance';
import { createFinancialTransaction, deleteFinancialTransaction, updateFinancialTransaction } from '@/services/finance';

type EventOption = { id: string; title: string };

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateBR = (value: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(value + 'T12:00:00'));
const statusLabel: Record<FinancialStatus, string> = { pendente: 'Pendente', pago: 'Pago', cancelado: 'Cancelado' };

const emptyForm = {
  type: 'receita' as FinancialType,
  event_id: '',
  description: '',
  category: '',
  amount: '',
  due_date: '',
  status: 'pendente' as FinancialStatus,
  notes: '',
};

export function FinanceManager({ initialTransactions, events }: { initialTransactions: FinancialTransaction[]; events: EventOption[] }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'todos' | 'receita' | 'despesa' | 'pendente'>('todos');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totals = useMemo(() => {
    const active = transactions.filter((item) => item.status !== 'cancelado');
    const receitasPagas = active.filter((item) => item.type === 'receita' && item.status === 'pago').reduce((s, i) => s + Number(i.amount), 0);
    const despesasPagas = active.filter((item) => item.type === 'despesa' && item.status === 'pago').reduce((s, i) => s + Number(i.amount), 0);
    const aReceber = active.filter((item) => item.type === 'receita' && item.status === 'pendente').reduce((s, i) => s + Number(i.amount), 0);
    const aPagar = active.filter((item) => item.type === 'despesa' && item.status === 'pendente').reduce((s, i) => s + Number(i.amount), 0);
    return { receitasPagas, despesasPagas, saldo: receitasPagas - despesasPagas, aReceber, aPagar };
  }, [transactions]);

  const visible = useMemo(() => transactions.filter((item) =>
    filter === 'todos' || filter === item.type || (filter === 'pendente' && item.status === 'pendente')
  ), [transactions, filter]);

  function openNew(type: FinancialType) {
    setEditing(null);
    setForm({ ...emptyForm, type, due_date: new Date().toISOString().slice(0, 10) });
    setFeedback(null);
    setOpen(true);
  }

  function openEdit(item: FinancialTransaction) {
    setEditing(item);
    setForm({
      type: item.type, event_id: item.event_id ?? '', description: item.description, category: item.category,
      amount: String(item.amount), due_date: item.due_date, status: item.status, notes: item.notes ?? '',
    });
    setFeedback(null);
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || !form.category.trim() || !form.amount || !form.due_date) {
      setFeedback({ type: 'error', text: 'Preencha descrição, categoria, valor e vencimento.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const input = {
        type: form.type,
        event_id: form.event_id || null,
        description: form.description,
        category: form.category,
        amount: Number(form.amount),
        due_date: form.due_date,
        paid_at: form.status === 'pago' ? (editing?.paid_at ?? new Date().toISOString()) : null,
        status: form.status,
        notes: form.notes,
      };
      const saved = editing
        ? await updateFinancialTransaction(createClient(), editing.id, input)
        : await createFinancialTransaction(createClient(), input);
      setTransactions((current) => editing
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current].sort((a, b) => a.due_date.localeCompare(b.due_date)));
      setFeedback({ type: 'success', text: editing ? 'Lançamento atualizado.' : 'Lançamento salvo com sucesso.' });
      setTimeout(() => setOpen(false), 450);
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Não foi possível salvar.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: FinancialTransaction) {
    if (!window.confirm(`Excluir o lançamento "${item.description}"?`)) return;
    try {
      await deleteFinancialTransaction(createClient(), item.id);
      setTransactions((current) => current.filter((entry) => entry.id !== item.id));
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Não foi possível excluir.' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<ArrowUpCircle size={19} />} label="Entradas recebidas" value={money(totals.receitasPagas)} tone="pink" helper={`+ ${money(totals.aReceber)} a receber`} />
        <Kpi icon={<ArrowDownCircle size={19} />} label="Saídas pagas" value={money(totals.despesasPagas)} tone="yellow" helper={`− ${money(totals.aPagar)} a pagar`} />
        <Kpi icon={<CalendarDays size={19} />} label="Saldo realizado" value={money(totals.saldo)} tone="teal" helper="Entradas pagas − saídas pagas" />
        <Kpi icon={<Plus size={19} />} label="Em aberto" value={money(totals.aReceber + totals.aPagar)} tone="neutral" helper={`${money(totals.aReceber)} a receber · ${money(totals.aPagar)} a pagar`} />
      </div>

      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="section-label">FLUXO DE CAIXA</p><h2 className="display-title mt-1 text-2xl">Entradas e saídas</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Registre cada movimentação e acompanhe o que já foi pago ou ainda está em aberto.</p></div>
          <div className="flex gap-2">
            <button onClick={() => openNew('receita')} className="button-primary"><ArrowUpCircle size={16} /> Entrada</button>
            <button onClick={() => openNew('despesa')} className="button-secondary"><ArrowDownCircle size={16} /> Saída</button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {([['todos','Todos'],['receita','Entradas'],['despesa','Saídas'],['pendente','Em aberto']] as const).map(([value,label]) => (
            <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'rounded-full bg-[var(--primary-soft)] px-4 py-2 text-xs font-bold text-[var(--primary)]' : 'rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--background)]'}>{label}</button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
        <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6"><h2 className="font-semibold">Histórico financeiro</h2><p className="mt-1 text-xs text-[var(--muted)]">{visible.length} lançamento(s)</p></div>
        <div className="divide-y divide-[var(--border)]">
          {visible.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-6">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.type === 'receita' ? 'bg-[var(--secondary-soft)] text-[var(--secondary)]' : 'bg-[var(--accent-soft)] text-[var(--warning)]'}`}>
                {item.type === 'receita' ? <ArrowUpCircle size={19} /> : <ArrowDownCircle size={19} />}
              </div>
              <div className="min-w-0 flex-1"><p className="font-semibold">{item.description}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.category} · {dateBR(item.due_date)}{item.event_id ? ' · evento vinculado' : ''}</p></div>
              <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${item.status === 'pago' ? 'bg-[var(--success-soft)] text-[var(--success)]' : item.status === 'cancelado' ? 'bg-[var(--danger-soft)] text-[var(--danger)]' : 'bg-[var(--warning-soft)] text-[var(--warning)]'}`}>{statusLabel[item.status]}</span>
              <p className={`min-w-32 text-left font-bold sm:text-right ${item.type === 'receita' ? 'text-[var(--secondary)]' : 'text-[var(--warning)]'}`}>{item.type === 'receita' ? '+' : '−'} {money(Number(item.amount))}</p>
              <div className="flex gap-1"><button onClick={() => openEdit(item)} className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"><Pencil size={16} /></button><button onClick={() => handleDelete(item)} className="rounded-lg p-2 text-[var(--danger)] hover:bg-[var(--danger-soft)]"><Trash2 size={16} /></button></div>
            </div>
          ))}
          {!visible.length && <div className="px-6 py-12 text-center text-sm text-[var(--muted)]">Nenhum lançamento encontrado.</div>}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 sm:items-center sm:p-5">
          <form onSubmit={save} className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="section-label">{form.type === 'receita' ? 'ENTRADA' : 'SAÍDA'}</p><h2 className="display-title mt-1 text-2xl">{editing ? 'Editar lançamento' : form.type === 'receita' ? 'Nova entrada' : 'Nova saída'}</h2></div><button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--background)]"><X size={19} /></button></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5"><span className="text-sm font-medium">Tipo</span><select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FinancialType }))} className="input"><option value="receita">Entrada / Receita</option><option value="despesa">Saída / Despesa</option></select></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Status</span><select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FinancialStatus }))} className="input"><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="cancelado">Cancelado</option></select></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Descrição *</span><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input" placeholder="Ex.: Festa aniversário Maria" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Categoria *</span><input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input" placeholder="Ex.: Festa, material, transporte" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Valor *</span><input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input" placeholder="0,00" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Vencimento *</span><input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="input" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Evento vinculado</span><select value={form.event_id} onChange={(e) => setForm((f) => ({ ...f, event_id: e.target.value }))} className="input"><option value="">Nenhum</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Observações</span><textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input resize-none" /></label>
            </div>
            {feedback && <p className={feedback.type === 'success' ? 'feedback-success mt-4' : 'feedback-error mt-4'}>{feedback.text}</p>}
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="button-secondary">Cancelar</button><button disabled={saving} className="button-primary disabled:opacity-60">{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar lançamento'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, helper, tone }: { icon: React.ReactNode; label: string; value: string; helper: string; tone: 'pink' | 'yellow' | 'teal' | 'neutral' }) {
  const classes = {
    pink: 'bg-[var(--primary-soft)] text-[var(--primary)]',
    yellow: 'bg-[var(--accent-soft)] text-[var(--warning)]',
    teal: 'bg-[var(--secondary-soft)] text-[var(--secondary)]',
    neutral: 'bg-[var(--background)] text-[var(--foreground)]',
  };
  return <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)]"><div className={`grid h-9 w-9 place-items-center rounded-xl ${classes[tone]}`}>{icon}</div><p className="mt-4 text-xs font-semibold text-[var(--muted)]">{label}</p><p className="mt-1 text-xl font-bold text-[var(--foreground)]">{value}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{helper}</p></section>;
}
