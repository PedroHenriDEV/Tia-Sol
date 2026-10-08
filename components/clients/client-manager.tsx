'use client';

import { useMemo, useState } from 'react';
import { Search, Plus, Pencil, Power, Users, X } from 'lucide-react';
import type { Client } from '@/types/database';
import { clientSchema, type ClientInput } from '@/validators/client';
import { createClientRecord, toggleClientStatus, updateClientRecord } from '@/services/clients';
import { createClient } from '@/lib/supabase/client';

type Props = { initialClients: Client[] };

const emptyForm: ClientInput = {
  name: '', document: '', phone: '', whatsapp: '', email: '',
  address: '', city: '', state: '', notes: '', active: true,
};

export function ClientManager({ initialClients }: Props) {
  const [clients, setClients] = useState(initialClients);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientInput>(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return clients.filter((client) => {
      const matchesQuery = !normalized || [client.name, client.phone, client.whatsapp, client.email]
        .filter(Boolean).some((value) => value!.toLowerCase().includes(normalized));
      const matchesStatus = status === 'all' || (status === 'active' ? client.active : !client.active);
      return matchesQuery && matchesStatus;
    });
  }, [clients, query, status]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFeedback(null);
    setOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({
      name: client.name, document: client.document ?? '', phone: client.phone ?? '',
      whatsapp: client.whatsapp ?? '', email: client.email ?? '', address: client.address ?? '',
      city: client.city ?? '', state: client.state ?? '', notes: client.notes ?? '', active: client.active,
    });
    setFeedback(null);
    setOpen(true);
  }

  async function save() {
    const parsed = clientSchema.safeParse(form);
    if (!parsed.success) {
      setFeedback({ type: 'error', text: parsed.error.issues[0]?.message ?? 'Revise os dados informados.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      if (editing) {
        const updated = await updateClientRecord(supabase, editing.id, parsed.data);
        setClients((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        const created = await createClientRecord(supabase, parsed.data);
        setClients((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setFeedback({ type: 'success', text: editing ? 'Cliente atualizado.' : 'Cliente cadastrado.' });
      setTimeout(() => setOpen(false), 450);
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', text: 'Não foi possível salvar o cliente.' });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(client: Client) {
    try {
      const updated = await toggleClientStatus(createClient(), client.id, !client.active);
      setClients((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', text: 'Não foi possível alterar o status.' });
    }
  }

  const field = (label: string, key: keyof ClientInput, type = 'text') => (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={String(form[key] ?? '')}
        onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-pink-600">Festas & eventos</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">Cadastre e organize as pessoas que contratam a Tia Sol.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700">
          <Plus size={18} /> Novo cliente
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-pink-400">
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600"><Users size={22} /></div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">{clients.length ? 'Nenhum cliente encontrado' : 'Ainda não há clientes'}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{clients.length ? 'Tente ajustar a busca ou o filtro.' : 'Cadastre o primeiro cliente para começar a montar seus eventos.'}</p>
          {!clients.length && <button onClick={openCreate} className="mt-5 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white">Cadastrar primeiro cliente</button>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {filtered.map((client) => (
              <div key={client.id} className="flex flex-col gap-3 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-700">
                    {client.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{client.name}</p>
                    <p className="truncate text-sm text-slate-500">{client.whatsapp || client.phone || client.email || 'Sem contato informado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-14 sm:pl-0">
                  <span className={client.active ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700' : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500'}>
                    {client.active ? 'Ativo' : 'Inativo'}
                  </span>
                  <button onClick={() => openEdit(client)} title="Editar" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil size={17} /></button>
                  <button onClick={() => toggle(client)} title={client.active ? 'Desativar' : 'Ativar'} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Power size={17} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div><h2 className="text-xl font-semibold text-slate-900">{editing ? 'Editar cliente' : 'Novo cliente'}</h2><p className="text-sm text-slate-500">Dados para contato e organização dos eventos.</p></div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('Nome completo *', 'name')}
              {field('CPF / CNPJ', 'document')}
              {field('WhatsApp', 'whatsapp')}
              {field('Telefone', 'phone')}
              {field('E-mail', 'email', 'email')}
              {field('Endereço', 'address')}
              {field('Cidade', 'city')}
              {field('UF', 'state')}
            </div>
            <label className="mt-4 block space-y-1.5"><span className="text-sm font-medium text-slate-700">Observações</span><textarea value={form.notes ?? ''} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} rows={4} className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100" /></label>
            <div className="mt-4 flex items-center gap-2"><input id="client-active" type="checkbox" checked={form.active} onChange={(e) => setForm((current) => ({ ...current, active: e.target.checked }))} /><label htmlFor="client-active" className="text-sm text-slate-700">Cliente ativo</label></div>
            {feedback && <p className={feedback.type === 'success' ? 'mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700' : 'mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700'}>{feedback.text}</p>}
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={saving} onClick={save} className="rounded-xl bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar cliente'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}