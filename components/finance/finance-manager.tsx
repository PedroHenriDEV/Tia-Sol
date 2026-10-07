'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { FinancialStatus, FinancialTransaction, FinancialType } from '@/types/finance';
import { createFinancialTransaction, deleteFinancialTransaction } from '@/services/finance';

type EventOption = { id: string; title: string };

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FinanceManager({
  initialTransactions,
  events,
}: {
  initialTransactions: FinancialTransaction[];
  events: EventOption[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [type, setType] = useState<FinancialType>('receita');
  const [status, setStatus] = useState<FinancialStatus>('pendente');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [eventId, setEventId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const totals = useMemo(() => {
    const receitas = transactions
      .filter((item) => item.type === 'receita' && item.status !== 'cancelado')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const despesas = transactions
      .filter((item) => item.type === 'despesa' && item.status !== 'cancelado')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const pendente = transactions
      .filter((item) => item.status === 'pendente')
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return { receitas, despesas, saldo: receitas - despesas, pendente };
  }, [transactions]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');

    if (!description.trim() || !category.trim() || !amount || !dueDate) {
      setMessage('Preencha descrição, categoria, valor e data.');
      return;
    }

    setSaving(true);
    try {
      const created = await createFinancialTransaction(createClient(), {
        type,
        event_id: eventId || null,
        description,
        category,
        amount: Number(amount),
        due_date: dueDate,
        paid_at: null,
        status,
        notes,
      });
      setTransactions((current) =>
        [...current, created].sort((a, b) =>
          a.due_date.localeCompare(b.due_date),
        ),
      );
      setDescription('');
      setCategory('');
      setAmount('');
      setDueDate('');
      setEventId('');
      setNotes('');
      setMessage('Lançamento salvo com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir este lançamento?')) return;

    try {
      await deleteFinancialTransaction(createClient(), id);
      setTransactions((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível excluir.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Receitas', totals.receitas],
          ['Despesas', totals.despesas],
          ['Saldo', totals.saldo],
          ['Pendente', totals.pendente],
        ].map(([label, value]) => (
          <section key={label as string} className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {money(value as number)}
            </p>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Novo lançamento</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <select value={type} onChange={(e) => setType(e.target.value as FinancialType)} className="field">
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" className="field" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria" className="field" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="Valor" className="field" />
          <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="field" />
          <select value={status} onChange={(e) => setStatus(e.target.value as FinancialStatus)} className="field">
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="field">
            <option value="">Sem evento vinculado</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
          </select>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações" className="field" />
          <div className="md:col-span-2 xl:col-span-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted)]">{message}</p>
            <button disabled={saving} className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? 'Salvando...' : 'Adicionar lançamento'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Lançamentos</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                <th className="pb-3">Descrição</th><th className="pb-3">Categoria</th><th className="pb-3">Vencimento</th><th className="pb-3">Status</th><th className="pb-3 text-right">Valor</th><th />
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-3 font-medium">{item.description}</td>
                  <td className="py-3">{item.category}</td>
                  <td className="py-3">{item.due_date}</td>
                  <td className="py-3">{item.status}</td>
                  <td className={'py-3 text-right font-semibold ' + (item.type === 'receita' ? 'text-emerald-700' : 'text-rose-700')}>{item.type === 'receita' ? '+' : '-'} {money(Number(item.amount))}</td>
                  <td className="py-3 text-right"><button type="button" onClick={() => handleDelete(item.id)} className="text-xs font-semibold text-rose-600 hover:underline">Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && <p className="py-8 text-center text-sm text-[var(--muted)]">Nenhum lançamento cadastrado.</p>}
        </div>
      </section>
    </div>
  );
}
