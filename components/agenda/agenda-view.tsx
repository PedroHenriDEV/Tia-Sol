'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Pencil, Plus, Trash2, X, Clock, Bell, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Client, Package } from '@/types/database';
import type { EventInput } from '@/validators/event';
import type { EventRecord, EventStatus } from '@/types/event';
import { eventSchema } from '@/validators/event';
import { createEvent, deleteEvent, updateEvent } from '@/services/events';
import { createClient } from '@/lib/supabase/client';
import { getEventUrgency } from '@/lib/event-urgency';

type Props = { initialEvents: EventRecord[]; clients: Client[]; packages: Package[] };

const statusLabels: Record<EventStatus, string> = {
  orcamento: 'Orçamento',
  aguardando_confirmacao: 'Aguardando confirmação',
  confirmado: 'Confirmado',
  contrato_gerado: 'Contrato gerado',
  contrato_assinado: 'Contrato assinado',
  pagamento_parcial: 'Pagamento parcial',
  pagamento_completo: 'Pagamento completo',
  realizado: 'Realizado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const emptyForm: EventInput = {
  title: '', client_id: null, package_id: null, event_date: '', start_time: '14:00',
  end_time: '16:00', location: '', status: 'aguardando_confirmacao',
  total_amount: 0, received_amount: 0, notes: '',
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthTitle(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value + 'T12:00:00'));
}

export function AgendaView({ initialEvents, clients, packages }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [month, setMonth] = useState(() => new Date());
  const [editing, setEditing] = useState<EventRecord | null>(null);
  const [form, setForm] = useState<EventInput>(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    const end = new Date(last);
    end.setDate(last.getDate() + (6 - last.getDay()));
    const result: Date[] = [];
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) result.push(new Date(cursor));
    return result;
  }, [month]);

  const operational = useMemo(() => {
    const todayKey = dateKey(new Date());
    const active = events.filter((event) => event.status !== 'cancelado' && event.status !== 'finalizado');
    const today = active.filter((event) => event.event_date === todayKey).sort((a, b) => a.start_time.localeCompare(b.start_time));
    const upcoming = active
      .filter((event) => event.event_date > todayKey)
      .sort((a, b) => (a.event_date + a.start_time).localeCompare(b.event_date + b.start_time))
      .slice(0, 6);
    const pending = active.filter((event) => ['orcamento', 'aguardando_confirmacao'].includes(event.status));
    return { today, upcoming, pending };
  }, [events]);

  const byDate = useMemo(() => {
    const map = new Map<string, EventRecord[]>();
    for (const event of events) map.set(event.event_date, [...(map.get(event.event_date) ?? []), event]);
    return map;
  }, [events]);

  function openCreate(date = dateKey(new Date())) {
    setEditing(null);
    setForm({ ...emptyForm, event_date: date });
    setFeedback(null);
    setOpen(true);
  }

  function openEdit(event: EventRecord) {
    setEditing(event);
    setForm({
      title: event.title, client_id: event.client_id, package_id: event.package_id,
      event_date: event.event_date, start_time: event.start_time.slice(0, 5),
      end_time: event.end_time.slice(0, 5), location: event.location ?? '',
      status: event.status, total_amount: event.total_amount, received_amount: event.received_amount,
      notes: event.notes ?? '',
    });
    setFeedback(null);
    setOpen(true);
  }

  function update<K extends keyof EventInput>(key: K, value: EventInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectPackage(id: string) {
    const pkg = packages.find((item) => item.id === id);
    setForm((current) => ({
      ...current,
      package_id: id || null,
      ...(pkg ? {
        title: current.title || pkg.name,
        total_amount: Number(pkg.price),
        end_time: current.start_time ? (() => {
          const [h, m] = current.start_time.split(':').map(Number);
          const total = h * 60 + m + Number(pkg.duration) * 60;
          return `${String(Math.floor((total % 1440) / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
        })() : current.end_time,
      } : {}),
    }));
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
      const saved = editing
        ? await updateEvent(supabase, editing.id, parsed.data)
        : await createEvent(supabase, parsed.data);
      setEvents((current) => editing
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved].sort((a, b) => (a.event_date + a.start_time).localeCompare(b.event_date + b.start_time)));
      setFeedback({ type: 'success', text: editing ? 'Evento atualizado.' : 'Evento salvo na agenda.' });
      setTimeout(() => setOpen(false), 500);
    } catch (error) {
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
    } catch {
      setFeedback({ type: 'error', text: 'Não foi possível excluir o evento.' });
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">DIA A DIA</p>
          <h1 className="display-title mt-1 text-3xl sm:text-4xl">Agenda</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Organize suas festas e compromissos em um só lugar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => openCreate(dateKey(new Date()))} className="button-primary"><Plus size={17} /> Novo evento</button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="section-label">OPERAÇÃO</p>
            <h2 className="display-title mt-1 text-2xl">Agenda operacional</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Veja o que precisa ser acompanhado hoje e nos próximos eventos.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Hoje</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><CalendarDays size={17} /></span></div>
            <p className="mt-3 text-2xl font-semibold">{operational.today.length}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{operational.today.length === 1 ? 'evento programado' : 'eventos programados'}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Próximos</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--secondary-soft)] text-[var(--secondary)]"><Clock size={17} /></span></div>
            <p className="mt-3 text-2xl font-semibold">{operational.upcoming.length}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">eventos já agendados</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Pendências</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><AlertTriangle size={17} /></span></div>
            <p className="mt-3 text-2xl font-semibold">{operational.pending.length}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">aguardando confirmação/orçamento</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
              <div><p className="text-sm font-semibold">Hoje</p><p className="text-xs text-[var(--muted-foreground)]">Compromissos em ordem de horário</p></div>
              <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--primary)]">{operational.today.length}</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {operational.today.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]"><CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={20} />Nenhum evento programado para hoje.</div>
              ) : operational.today.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-4">
                  <div className="w-16 shrink-0 text-center"><p className="text-sm font-bold">{event.start_time.slice(0,5)}</p><p className="text-[10px] text-[var(--muted)]">{event.end_time.slice(0,5)}</p></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{event.title}</p><p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">{event.client?.name ?? 'Cliente não informado'}{event.location ? ` · ${event.location}` : ''}</p></div>
                  <a href={`/eventos/${event.id}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] hover:opacity-80" title="Abrir central"><Eye size={16} /></a>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
              <div><p className="text-sm font-semibold">Próximos eventos</p><p className="text-xs text-[var(--muted-foreground)]">O que vem pela frente</p></div>
              <span className="rounded-full bg-[var(--secondary-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--secondary)]">{operational.upcoming.length}</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {operational.upcoming.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">Nenhum próximo evento cadastrado.</div>
              ) : operational.upcoming.map((event) => {
                const urgency = getEventUrgency(event.event_date);
                return (
                  <div key={event.id} className="flex items-center gap-3 p-4">
                    <div className="w-20 shrink-0 rounded-xl bg-[var(--background)] p-2 text-center"><p className="text-xs font-bold">{formatDate(event.event_date)}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{event.start_time.slice(0,5)}</p></div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{event.title}</p><p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">{event.client?.name ?? 'Cliente não informado'}</p></div>
                    <span className={"hidden rounded-full px-2 py-1 text-[10px] font-bold sm:inline-flex " + urgency.className}>{urgency.label}</span>
                    <a href={`/eventos/${event.id}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] hover:opacity-80" title="Abrir central"><Eye size={16} /></a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4 sm:px-6">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[var(--background)]"><ChevronLeft size={18} /></button>
          <div className="text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Calendário</p><h2 className="display-title text-xl capitalize sm:text-2xl">{monthTitle(month)}</h2></div>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[var(--background)]"><ChevronRight size={18} /></button>
        </div>
        <div className="grid min-w-[420px] grid-cols-7 border-b border-[var(--border)]">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((day) => <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{day}</div>)}
        </div>
        <div className="grid min-w-[420px] grid-cols-7">
          {days.map((day) => {
            const key = dateKey(day);
            const items = byDate.get(key) ?? [];
            const inMonth = day.getMonth() === month.getMonth();
            const today = key === dateKey(new Date());
            return (
              <button key={key} type="button" onClick={() => openCreate(key)} className={'min-h-24 border-b border-r border-[var(--border)] p-2 text-left transition hover:bg-[var(--primary-soft)] sm:min-h-28 ' + (!inMonth ? 'opacity-40 ' : '')}>
                <span className={'grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ' + (today ? 'bg-[var(--primary)] text-white' : 'text-[var(--foreground)]')}>{day.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {items.slice(0, 2).map((event) => {
                    const urgency = getEventUrgency(event.event_date);
                    return (
                      <span key={event.id} onClick={(e) => { e.stopPropagation(); openEdit(event); }} className={'block truncate rounded-md px-1.5 py-1 text-[10px] font-semibold ' + (event.status === 'cancelado' ? 'bg-[var(--danger-soft)] text-[var(--danger)]' : urgency.className)}>
                        {event.start_time.slice(0,5)} · {event.title}
                      </span>
                    );
                  })}
                  {items.length > 2 && <span className="block px-1 text-[10px] text-[var(--muted)]">+ {items.length - 2} evento(s)</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3"><div><p className="section-label">AGENDA</p><h2 className="display-title mt-1 text-2xl">Próximos eventos</h2></div><span className="text-xs text-[var(--muted)]">{events.length} cadastrado(s)</span></div>
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--card)] px-6 py-12 text-center"><CalendarDays className="mx-auto text-[var(--primary)]" /><p className="mt-3 font-semibold">Nenhum evento cadastrado</p><p className="mt-1 text-sm text-[var(--muted)]">Clique em um dia do calendário para marcar uma festa.</p></div>
        ) : (
          <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            {events.filter((e) => e.status !== 'cancelado').slice(0, 12).map((event) => {
              const urgency = getEventUrgency(event.event_date);
              return (
                <div key={event.id} className={'flex flex-col gap-3 border-l-4 p-4 sm:flex-row sm:items-center ' + urgency.softClassName}>
                  <div className={'w-28 shrink-0 rounded-xl p-2.5 ' + urgency.softClassName}><p className="text-xs font-bold">{formatDate(event.event_date)}</p><p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><Clock size={12} />{event.start_time.slice(0,5)}–{event.end_time.slice(0,5)}</p></div>
                  <div className="min-w-0 flex-1"><p className="font-semibold">{event.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">{event.client?.name ?? 'Cliente não informado'} {event.location && <>· <MapPin size={12} /> {event.location}</>}</p>{urgency.reminder && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold"><Bell size={13} />{urgency.reminder}</p>}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={'w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ' + urgency.className}>{urgency.label}</span>
                    <span className="w-fit rounded-full bg-[var(--secondary-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--secondary)]">{statusLabels[event.status]}</span>
                  </div>
                  <div className="flex gap-1"><button onClick={() => openEdit(event)} className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"><Pencil size={16} /></button><button onClick={() => remove(event)} className="rounded-lg p-2 text-[var(--danger)] hover:bg-[var(--danger-soft)]"><Trash2 size={16} /></button></div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 sm:items-center sm:p-5">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-3xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="section-label">EVENTO</p><h2 className="display-title mt-1 text-2xl">{editing ? 'Editar evento' : 'Novo evento'}</h2></div><button onClick={() => setOpen(false)} className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--background)]"><X size={19} /></button></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Nome do evento *</span><input value={form.title} onChange={(e) => update('title', e.target.value)} className="input" placeholder="Ex.: Aniversário da Ana" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Cliente</span><select value={form.client_id ?? ''} onChange={(e) => update('client_id', e.target.value || null)} className="input"><option value="">Selecionar cliente</option>{clients.filter((c) => c.active).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Pacote</span><select value={form.package_id ?? ''} onChange={(e) => selectPackage(e.target.value)} className="input"><option value="">Selecionar pacote</option>{packages.filter((p) => p.active).map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} · R$ {Number(pkg.price).toFixed(2).replace('.', ',')}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Data *</span><input type="date" value={form.event_date} onChange={(e) => update('event_date', e.target.value)} className="input" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Status</span><select value={form.status} onChange={(e) => update('status', e.target.value as EventStatus)} className="input">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Início *</span><input type="time" value={form.start_time} onChange={(e) => update('start_time', e.target.value)} className="input" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Fim *</span><input type="time" value={form.end_time} onChange={(e) => update('end_time', e.target.value)} className="input" /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Local</span><input value={form.location ?? ''} onChange={(e) => update('location', e.target.value)} className="input" placeholder="Endereço ou local da festa" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Valor total</span><input type="number" min="0" step="0.01" value={form.total_amount} onChange={(e) => update('total_amount', Number(e.target.value))} className="input" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Valor recebido</span><input type="number" min="0" step="0.01" value={form.received_amount} onChange={(e) => update('received_amount', Number(e.target.value))} className="input" /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Observações</span><textarea rows={4} value={form.notes ?? ''} onChange={(e) => update('notes', e.target.value)} className="input resize-none" /></label>
            </div>
            {feedback && <p className={feedback.type === 'success' ? 'feedback-success mt-4' : 'feedback-error mt-4'}>{feedback.text}</p>}
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => setOpen(false)} className="button-secondary">Cancelar</button><button disabled={saving} onClick={save} className="button-primary disabled:opacity-60">{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar evento'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}