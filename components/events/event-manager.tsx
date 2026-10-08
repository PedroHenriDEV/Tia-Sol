'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Eye, Pencil, Plus, Search, Trash2, X, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Client, Package } from '@/types/database';
import type { EventRecord } from '@/types/event';
import { eventSchema, type EventInput } from '@/validators/event';
import { createEvent, deleteEvent, updateEvent } from '@/services/events';
import { createClient } from '@/lib/supabase/client';
import { getEventUrgency } from '@/lib/event-urgency';

type Props = { initialEvents: EventRecord[]; clients: Client[]; packages: Package[] };

const emptyForm: EventInput = {
  title: '', client_id: null, package_id: null, event_date: '', start_time: '14:00', end_time: '16:00',
  location: '', status: 'orcamento', total_amount: 0, received_amount: 0, notes: '',
};

const statusLabels: Record<EventInput['status'], string> = {
  orcamento: 'Orçamento', aguardando_confirmacao: 'Aguardando confirmação', confirmado: 'Confirmado',
  contrato_gerado: 'Contrato gerado', contrato_assinado: 'Contrato assinado', pagamento_parcial: 'Pagamento parcial',
  pagamento_completo: 'Pagamento completo', realizado: 'Realizado', finalizado: 'Finalizado', cancelado: 'Cancelado',
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value + 'T12:00:00'));
}

export function EventManager({ initialEvents, clients, packages }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | EventInput['status']>('all');
  const [editing, setEditing] = useState<EventRecord | null>(null);
  const [form, setForm] = useState<EventInput>(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const stats = useMemo(() => {
    const active = events.filter((event) => event.status !== 'cancelado');
    const confirmed = active.filter((event) => ['confirmado', 'contrato_gerado', 'contrato_assinado'].includes(event.status));
    const pending = active.filter((event) => event.received_amount < event.total_amount);
    return { active: active.length, confirmed: confirmed.length, pending: pending.length };
  }, [events]);

  const statCards: Array<[string, number, LucideIcon]> = [
    ['Eventos ativos', stats.active, CalendarDays],
    ['Confirmados', stats.confirmed, CheckCircle2],
    ['Com saldo', stats.pending, Clock3],
  ];

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return events
      .filter((event) => {
        const text = [event.title, event.location, event.client?.name, event.package?.name].filter(Boolean).join(' ').toLowerCase();
        return (!normalized || text.includes(normalized)) && (status === 'all' || event.status === status);
      })
      .sort((a, b) => a.event_date.localeCompare(b.event_date) || a.start_time.localeCompare(b.start_time));
  }, [events, query, status]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, event_date: new Date().toISOString().slice(0, 10) });
    setFeedback(null);
    setOpen(true);
  }

  function openEdit(event: EventRecord) {
    setEditing(event);
    setForm({
      title: event.title, client_id: event.client_id, package_id: event.package_id, event_date: event.event_date,
      start_time: event.start_time, end_time: event.end_time, location: event.location ?? '', status: event.status,
      total_amount: event.total_amount, received_amount: event.received_amount, notes: event.notes ?? '',
    });
    setFeedback(null);
    setOpen(true);
  }

  async function save() {
    const parsed = eventSchema.safeParse(form);
    if (!parsed.success) {
      setFeedback({ type: 'error', text: parsed.error.issues[0]?.message ?? 'Revise os dados informados.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      if (editing) {
        const updated = await updateEvent(supabase, editing.id, parsed.data);
        setEvents((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        const created = await createEvent(supabase, parsed.data);
        setEvents((current) => [...current, created]);
      }
      setFeedback({ type: 'success', text: editing ? 'Evento atualizado.' : 'Evento cadastrado.' });
      setTimeout(() => setOpen(false), 450);
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Não foi possível salvar o evento.' });
    } finally {
      setSaving(false);
    }
  }

  async function remove(event: EventRecord) {
    if (!window.confirm(`Excluir o evento "${event.title}"?`)) return;
    try {
      await deleteEvent(createClient(), event.id);
      setEvents((current) => current.filter((item) => item.id !== event.id));
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', text: 'Não foi possível excluir o evento.' });
    }
  }

  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-pink-600">Festas & eventos</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Eventos</h1>
          <p className="mt-1 text-sm text-slate-500">Centralize festas, clientes, horários, valores e status em um só lugar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/agenda" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><CalendarDays size={17} /> Ver agenda</Link>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-700"><Plus size={18} /> Novo evento</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {statCards.map(([label, value, Icon]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-pink-50 text-pink-600"><Icon size={17} /></span></div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por evento, cliente ou local..." className={fieldClass + ' pl-10'} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={fieldClass + ' sm:w-64'}>
          <option value="all">Todos os status</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-pink-50 text-pink-600"><CalendarDays size={22} /></div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{events.length ? 'Nenhum evento encontrado' : 'Ainda não há eventos'}</h2>
            <p className="mt-1 text-sm text-slate-500">{events.length ? 'Ajuste a busca ou o filtro.' : 'Cadastre o primeiro evento para começar.'}</p>
            {!events.length && <button onClick={openCreate} className="mt-5 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white">Cadastrar primeiro evento</button>}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((event) => {
              const balance = Math.max(0, event.total_amount - event.received_amount);
              const urgency = getEventUrgency(event.event_date);
              return (
                <div key={event.id} className={`flex flex-col gap-4 border-l-4 p-4 transition hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between ${urgency.softClassName}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-slate-900">{event.title}</h2>
                      <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[11px] font-semibold text-pink-700">{statusLabels[event.status]}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${urgency.className}`}>{urgency.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{event.client?.name ?? 'Sem cliente'} · {dateLabel(event.event_date)} · {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">{event.location || 'Local não informado'}{event.package?.name ? ` · ${event.package.name}` : ''}</p>
                    {urgency.reminder && <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${urgency.className.split(' ').find((item) => item.startsWith('text-')) ?? 'text-slate-600'}`}><Bell size={13} /> {urgency.reminder}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <div className="text-left lg:text-right"><p className="text-xs text-slate-400">Total</p><p className="font-semibold text-slate-900">{money(event.total_amount)}</p>{balance > 0 && <p className="text-xs text-amber-600">Saldo {money(balance)}</p>}</div>
                    <Link href={`/eventos/${event.id}`} title="Central do evento" className="inline-flex items-center gap-2 rounded-lg border border-pink-100 bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-700 hover:bg-pink-100"><Eye size={15} /> Central</Link>
                    <button onClick={() => openEdit(event)} title="Editar" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil size={17} /></button>
                    <button onClick={() => remove(event)} title="Excluir" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 sm:items-center sm:p-6">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-3xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold text-slate-900">{editing ? 'Editar evento' : 'Novo evento'}</h2><p className="text-sm text-slate-500">Os dados ficam no mesmo cadastro usado pela Agenda.</p></div><button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Nome do evento *</span><input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={fieldClass} /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Cliente</span><select value={form.client_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value || null }))} className={fieldClass}><option value="">Sem cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Pacote</span><select value={form.package_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, package_id: e.target.value || null }))} className={fieldClass}><option value="">Sem pacote</option>{packages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Data *</span><input type="date" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} className={fieldClass} /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Status</span><select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as EventInput['status'] }))} className={fieldClass}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Início *</span><input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} className={fieldClass} /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Fim *</span><input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} className={fieldClass} /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Local</span><input value={form.location ?? ''} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className={fieldClass} /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Valor total</span><input type="number" min="0" step="0.01" value={form.total_amount} onChange={(e) => setForm((f) => ({ ...f, total_amount: Number(e.target.value) }))} className={fieldClass} /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Valor recebido</span><input type="number" min="0" step="0.01" value={form.received_amount} onChange={(e) => setForm((f) => ({ ...f, received_amount: Number(e.target.value) }))} className={fieldClass} /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Observações</span><textarea rows={4} value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={fieldClass + ' resize-none'} /></label>
            </div>
            {feedback && <p className={feedback.type === 'success' ? 'mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700' : 'mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700'}>{feedback.text}</p>}
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={saving} onClick={save} className="rounded-xl bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar evento'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
