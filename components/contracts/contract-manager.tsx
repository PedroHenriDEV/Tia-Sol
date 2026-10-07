'use client';

import { useMemo, useState } from 'react';
import { FileSignature, Pencil, Plus, Trash2, X, CheckCircle2, Copy, Eye } from 'lucide-react';
import type { Company, Client, Package } from '@/types/database';
import type { EventRecord } from '@/types/event';
import type { ContractRecord } from '@/types/contract';
import { contractSchema, type ContractInput } from '@/validators/contract';
import { createContract, deleteContract, updateContract } from '@/services/contracts';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

type Props = {
  initialContracts: ContractRecord[];
  events: EventRecord[];
  clients: Client[];
  packages: Package[];
  company: Company | null;
};

const emptyForm: ContractInput = {
  event_id: null, client_id: null, package_id: null, status: 'rascunho',
  contractor_name: '', contractor_document: '', contractor_rg: '', contractor_address: '',
  contractor_phone: '', contractor_email: '', celebrant_name: '', children_estimate: 0,
  age_range: '', event_theme: '', event_date: '', start_time: '', end_time: '',
  event_location: '', event_location_type: '', team_size: 1, included_activities: [],
  included_equipment: [], total_amount: 0, deposit_amount: 0, deposit_date: '',
  balance_amount: 0, balance_due_date: '', payment_method: 'PIX', pix_key: '',
  additional_payment_terms: '', arrival_minutes: 30, catering_required: false,
  image_authorized: false, additional_observations: '', contract_details: '',
};

const statusLabels = { rascunho: 'Rascunho', gerado: 'Gerado', enviado: 'Enviado', assinado: 'Assinado', cancelado: 'Cancelado' };

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function dateLabel(value?: string | null) {
  if (!value) return 'não informado';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value + 'T12:00:00'));
}

function companyName(company: Company | null) {
  return company?.trade_name || company?.legal_name || 'TIA SOL RECREAÇÃO INFANTIL LTDA';
}

function buildContractText(form: ContractInput, number: string, company: Company | null, packageName?: string | null) {
  const name = companyName(company);
  const cnpj = company?.tax_id || 'não informado';
  const phone = company?.phone || company?.whatsapp || 'não informado';
  const address = [company?.address, company?.city, company?.state].filter(Boolean).join(', ') || 'não informado';
  const pix = form.pix_key || company?.pix_key || 'não informado';
  const activities = form.included_activities.length ? form.included_activities.map((item) => '• ' + item).join('\n') : '• Conforme pacote selecionado';
  const equipment = form.included_equipment.length ? form.included_equipment.map((item) => '• ' + item).join('\n') : '• Materiais necessários para as atividades contratadas';
  const balance = Math.max(0, Number(form.total_amount) - Number(form.deposit_amount));
  const today = new Intl.DateTimeFormat('pt-BR').format(new Date());

  return `${name}
CNPJ: ${cnpj} • Telefone/WhatsApp: ${phone} • ${address}

CONTRATO DE PRESTAÇÃO DE SERVIÇOS Nº ${number}

INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE RECREAÇÃO E ANIMAÇÃO INFANTIL

CONTRATADA: ${name}, inscrita no CNPJ sob nº ${cnpj}, com endereço em ${address}, telefone ${phone}.

CONTRATANTE: ${form.contractor_name}, inscrito(a) no CPF/CNPJ sob nº ${form.contractor_document || 'não informado'}, RG nº ${form.contractor_rg || 'não informado'}, residente e domiciliado(a) em ${form.contractor_address || 'não informado'}, telefone/WhatsApp ${form.contractor_phone || 'não informado'}, e-mail ${form.contractor_email || 'não informado'}.

As partes acima qualificadas celebram o presente contrato de prestação de serviços, regido pelas cláusulas e condições seguintes:

CLÁUSULA 1ª – DO OBJETO DO CONTRATO

O presente contrato tem como objeto a prestação de serviços especializados de recreação, entretenimento e animação infantil para o evento comemorativo.

• Aniversariante(s): ${form.celebrant_name || 'não informado'}
• Estimativa de crianças: ${form.children_estimate || 0}
• Faixa etária: ${form.age_range || 'não informada'}
• Tema do evento: ${form.event_theme || 'não informado'}
• Pacote contratado: ${packageName || 'não informado'}

CLÁUSULA 2ª – DA DATA, HORÁRIO E LOCAL DO EVENTO

• Data do evento: ${dateLabel(form.event_date)}
• Horário: das ${form.start_time || '--:--'} às ${form.end_time || '--:--'}
• Local: ${form.event_location || 'não informado'}
• Tipo de local: ${form.event_location_type || 'não informado'}

CLÁUSULA 3ª – DA EQUIPE E ATIVIDADES INCLUSAS

A CONTRATADA disponibilizará ${form.team_size} recreador(es)/animador(es), devidamente uniformizados e qualificados, fornecendo os materiais necessários para a execução das atividades abaixo:

${activities}

Equipamentos e materiais inclusos:
${equipment}

CLÁUSULA 4ª – DO VALOR E FORMA DE PAGAMENTO

Pela execução dos serviços descritos, a CONTRATANTE pagará à CONTRATADA o valor total de ${money(Number(form.total_amount))}.

a) Sinal/Reserva de Data: ${money(Number(form.deposit_amount))}${form.deposit_date ? ` pago em ${dateLabel(form.deposit_date)}` : ''}.
b) Saldo Restante: ${money(balance)}${form.balance_due_date ? ` a ser quitado até ${dateLabel(form.balance_due_date)}` : ''}.
c) Forma de pagamento: ${form.payment_method || 'não informada'}.
d) Chave PIX: ${pix}.

Condições adicionais:
${form.additional_payment_terms || 'Não há condições adicionais informadas.'}

CLÁUSULA 5ª – DAS RESPONSABILIDADES E OBRIGAÇÕES

1. A CONTRATADA compromete-se a chegar com antecedência mínima de ${form.arrival_minutes} minutos para ambientação e organização dos materiais.
2. A CONTRATANTE deve garantir espaço seguro, limpo e adequado para as brincadeiras, além de ponto de energia elétrica caso necessário.
3. A guarda, vigilância geral e integridade física de crianças menores de 3 anos ou que necessitem de cuidados especiais permanecem sob responsabilidade dos respectivos pais ou responsáveis presentes no evento.
4. ${form.catering_required ? 'A alimentação dos monitores será fornecida pela CONTRATANTE, conforme combinado entre as partes.' : 'Não foi prevista alimentação dos monitores como condição obrigatória neste contrato.'}

CLÁUSULA 6ª – DO CANCELAMENTO E REMARCAÇÃO

1. Em caso de desistência ou necessidade de remarcação, serão observadas as condições previamente acordadas entre as partes e registradas neste contrato.
2. Em caso de força maior, as partes poderão acordar nova data, conforme disponibilidade da CONTRATADA.
3. Outras condições específicas: ${form.contract_details || 'Não foram informadas condições adicionais.'}

CLÁUSULA 7ª – DO USO DE IMAGEM

A CONTRATANTE ${form.image_authorized ? 'AUTORIZA' : 'NÃO AUTORIZA'} o registro fotográfico e em vídeo da equipe de recreação durante o evento para divulgação em portfólio profissional e redes sociais da CONTRATADA, sempre prezando pelo respeito e integridade das crianças.

CLÁUSULA 8ª – DAS OBSERVAÇÕES ADICIONAIS

${form.additional_observations || 'Não há observações adicionais.'}

CLÁUSULA 9ª – DO FORO

Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem o foro da Comarca de ${company?.city || 'São Paulo'} - ${company?.state || 'SP'}.

E por estarem justos e contratados, firmam o presente instrumento.

${address}, ${today}.

____________________________________________
CONTRATANTE: ${form.contractor_name}
CPF/CNPJ: ${form.contractor_document || 'não informado'}

____________________________________________
CONTRATADA: ${name}
`;
}

export function ContractManager({ initialContracts, events, clients, packages, company }: Props) {
  const [contracts, setContracts] = useState(initialContracts);
  const [editing, setEditing] = useState<ContractRecord | null>(null);
  const [form, setForm] = useState<ContractInput>(emptyForm);
  const [number, setNumber] = useState('001/' + new Date().getFullYear());
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const selectedPackage = useMemo(() => packages.find((item) => item.id === form.package_id), [packages, form.package_id]);

  function patch(values: Partial<ContractInput>) {
    setForm((current) => ({ ...current, ...values }));
  }

  function selectEvent(eventId: string) {
    const event = events.find((item) => item.id === eventId);
    if (!event) {
      patch({ event_id: null });
      return;
    }
    const client = clients.find((item) => item.id === event.client_id);
    const pack = packages.find((item) => item.id === event.package_id);
    patch({
      event_id: event.id,
      client_id: event.client_id,
      package_id: event.package_id,
      contractor_name: client?.name || '',
      contractor_document: client?.document || '',
      contractor_address: [client?.address, client?.city, client?.state].filter(Boolean).join(', '),
      contractor_phone: client?.whatsapp || client?.phone || '',
      contractor_email: client?.email || '',
      event_date: event.event_date,
      start_time: event.start_time.slice(0, 5),
      end_time: event.end_time.slice(0, 5),
      event_location: event.location || '',
      total_amount: event.total_amount || pack?.price || 0,
      balance_amount: Math.max(0, event.total_amount - event.received_amount),
      included_activities: pack?.activities || [],
    });
  }

  function selectPackage(packageId: string) {
    const pack = packages.find((item) => item.id === packageId);
    if (!pack) return;
    patch({
      package_id: pack.id,
      total_amount: pack.price > 0 ? pack.price : form.total_amount,
      included_activities: [...pack.activities],
      additional_payment_terms: pack.notes || '',
    });
  }

  function openCreate() {
    setEditing(null);
    setNumber('001/' + new Date().getFullYear());
    setForm({ ...emptyForm });
    setFeedback('');
    setPreview(false);
    setOpen(true);
  }

  function openEdit(contract: ContractRecord) {
    setEditing(contract);
    setNumber(String(contract.contract_number).padStart(3, '0') + '/' + contract.contract_year);
    setForm({
      event_id: contract.event_id, client_id: contract.client_id, package_id: contract.package_id, status: contract.status,
      contractor_name: contract.contractor_name, contractor_document: contract.contractor_document || '',
      contractor_rg: contract.contractor_rg || '', contractor_address: contract.contractor_address || '',
      contractor_phone: contract.contractor_phone || '', contractor_email: contract.contractor_email || '',
      celebrant_name: contract.celebrant_name || '', children_estimate: contract.children_estimate || 0,
      age_range: contract.age_range || '', event_theme: contract.event_theme || '', event_date: contract.event_date || '',
      start_time: contract.start_time?.slice(0, 5) || '', end_time: contract.end_time?.slice(0, 5) || '',
      event_location: contract.event_location || '', event_location_type: contract.event_location_type || '',
      team_size: contract.team_size, included_activities: contract.included_activities || [],
      included_equipment: contract.included_equipment || [], total_amount: contract.total_amount,
      deposit_amount: contract.deposit_amount, deposit_date: contract.deposit_date || '',
      balance_amount: contract.balance_amount, balance_due_date: contract.balance_due_date || '',
      payment_method: contract.payment_method || 'PIX', pix_key: contract.pix_key || company?.pix_key || '',
      additional_payment_terms: contract.additional_payment_terms || '', arrival_minutes: contract.arrival_minutes,
      catering_required: contract.catering_required, image_authorized: contract.image_authorized,
      additional_observations: contract.additional_observations || '', contract_details: contract.contract_details || '',
    });
    setFeedback('');
    setPreview(false);
    setOpen(true);
  }

  async function save() {
    const parsed = contractSchema.safeParse(form);
    if (!parsed.success) {
      setFeedback(parsed.error.issues[0]?.message || 'Revise os dados do contrato.');
      return;
    }
    setSaving(true);
    setFeedback('');
    try {
      const generated = buildContractText(parsed.data, number, company, packages.find((item) => item.id === parsed.data.package_id)?.name);
      const supabase = createSupabaseClient();
      if (editing) {
        const updated = await updateContract(supabase, editing.id, parsed.data, generated);
        setContracts((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        const created = await createContract(supabase, parsed.data, generated);
        setContracts((current) => [created, ...current]);
        setNumber(String(created.contract_number).padStart(3, '0') + '/' + created.contract_year);
      }
      setFeedback(editing ? 'Contrato atualizado.' : 'Contrato salvo.');
      setTimeout(() => setOpen(false), 500);
    } catch (error) {
      console.error(error);
      setFeedback(error instanceof Error ? error.message : 'Não foi possível salvar o contrato.');
    } finally {
      setSaving(false);
    }
  }

  function openView(contract: ContractRecord) {
    setEditing(contract);
    setNumber(String(contract.contract_number).padStart(3, '0') + '/' + contract.contract_year);
    setForm({
      event_id: contract.event_id, client_id: contract.client_id, package_id: contract.package_id, status: contract.status,
      contractor_name: contract.contractor_name, contractor_document: contract.contractor_document || '',
      contractor_rg: contract.contractor_rg || '', contractor_address: contract.contractor_address || '',
      contractor_phone: contract.contractor_phone || '', contractor_email: contract.contractor_email || '',
      celebrant_name: contract.celebrant_name || '', children_estimate: contract.children_estimate || 0,
      age_range: contract.age_range || '', event_theme: contract.event_theme || '', event_date: contract.event_date || '',
      start_time: contract.start_time?.slice(0, 5) || '', end_time: contract.end_time?.slice(0, 5) || '',
      event_location: contract.event_location || '', event_location_type: contract.event_location_type || '',
      team_size: contract.team_size, included_activities: contract.included_activities || [],
      included_equipment: contract.included_equipment || [], total_amount: contract.total_amount,
      deposit_amount: contract.deposit_amount, deposit_date: contract.deposit_date || '',
      balance_amount: contract.balance_amount, balance_due_date: contract.balance_due_date || '',
      payment_method: contract.payment_method || 'PIX', pix_key: contract.pix_key || company?.pix_key || '',
      additional_payment_terms: contract.additional_payment_terms || '', arrival_minutes: contract.arrival_minutes,
      catering_required: contract.catering_required, image_authorized: contract.image_authorized,
      additional_observations: contract.additional_observations || '', contract_details: contract.contract_details || '',
    });
    setFeedback('');
    setPreview(true);
    setOpen(true);
  }

  async function remove(contract: ContractRecord) {
    if (!window.confirm(`Excluir o contrato ${String(contract.contract_number).padStart(3, '0')}/${contract.contract_year}?`)) return;
    try {
      await deleteContract(createSupabaseClient(), contract.id);
      setContracts((current) => current.filter((item) => item.id !== contract.id));
    } catch {
      setFeedback('Não foi possível excluir o contrato.');
    }
  }

  function addLine(field: 'included_activities' | 'included_equipment') {
    const value = window.prompt(field === 'included_activities' ? 'Nova atividade incluída:' : 'Novo equipamento/material incluído:');
    if (value?.trim()) patch({ [field]: [...form[field], value.trim()] });
  }

  function removeLine(field: 'included_activities' | 'included_equipment', index: number) {
    patch({ [field]: form[field].filter((_, itemIndex) => itemIndex !== index) });
  }

  const input = 'input mt-1';
  const select = 'input mt-1';
  const textarea = 'input mt-1 min-h-24 resize-y';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-pink-600">Documentos</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">Contratos</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">Monte o contrato a partir do evento e do pacote, revise os campos e gere o texto completo para assinatura.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"><Plus size={18} /> Novo contrato</button>
      </div>

      <div className="rounded-2xl border border-pink-100 bg-pink-50 p-4 text-sm text-pink-900">
        <strong>Facilidade:</strong> selecione um evento para puxar cliente, data, horário e valor. Depois escolha ou troque o pacote para preencher automaticamente as atividades inclusas.
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        {contracts.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-pink-50 text-pink-600"><FileSignature size={22} /></div>
            <h2 className="mt-4 text-lg font-semibold">Nenhum contrato cadastrado</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Crie o primeiro contrato usando um evento ou preenchendo os dados manualmente.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {contracts.map((contract) => (
              <div key={contract.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">Contrato {String(contract.contract_number).padStart(3, '0')}/{contract.contract_year}</h2>
                    <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[11px] font-semibold text-pink-700">{statusLabels[contract.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{contract.contractor_name} · {dateLabel(contract.event_date)} · {money(contract.total_amount)}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{contract.package?.name || 'Sem pacote'}{contract.event_location ? ' · ' + contract.event_location : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openView(contract)} title="Visualizar" className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"><Eye size={17} /></button>
                  <button onClick={() => openEdit(contract)} title="Editar" className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"><Pencil size={17} /></button>
                  <button onClick={() => remove(contract)} title="Excluir" className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-5">
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-6xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-600">Contrato {number}</p><h2 className="mt-1 text-xl font-semibold text-slate-900">{editing ? 'Editar contrato' : 'Novo contrato'}</h2><p className="text-sm text-slate-500">Preencha os dados e revise a prévia antes de salvar.</p></div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
              <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">1. Vincular ao evento e pacote</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label><span className="text-sm font-medium">Evento</span><select value={form.event_id || ''} onChange={(e) => selectEvent(e.target.value)} className={select}><option value="">Preenchimento manual</option>{events.filter((e) => e.status !== 'cancelado').map((e) => <option key={e.id} value={e.id}>{e.title} · {dateLabel(e.event_date)}</option>)}</select></label>
                    <label><span className="text-sm font-medium">Pacote</span><select value={form.package_id || ''} onChange={(e) => selectPackage(e.target.value)} className={select}><option value="">Selecione um pacote</option>{packages.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name}{p.price > 0 ? ` · ${money(p.price)}` : ''}</option>)}</select></label>
                  </div>
                  {selectedPackage && <div className="mt-3 rounded-xl bg-pink-50 p-3 text-sm text-pink-900"><strong>{selectedPackage.name}</strong> · {selectedPackage.duration}h{selectedPackage.price > 0 ? ` · ${money(selectedPackage.price)}` : ' · Valor a definir'}<p className="mt-1 text-xs">Ao selecionar este pacote, as atividades abaixo são preenchidas automaticamente.</p></div>}
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">2. Dados do contratante</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2"><span className="text-sm font-medium">Nome completo *</span><input value={form.contractor_name} onChange={(e) => patch({ contractor_name: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">CPF/CNPJ</span><input value={form.contractor_document || ''} onChange={(e) => patch({ contractor_document: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">RG</span><input value={form.contractor_rg || ''} onChange={(e) => patch({ contractor_rg: e.target.value })} className={input} /></label>
                    <label className="sm:col-span-2"><span className="text-sm font-medium">Endereço residencial</span><input value={form.contractor_address || ''} onChange={(e) => patch({ contractor_address: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Telefone/WhatsApp</span><input value={form.contractor_phone || ''} onChange={(e) => patch({ contractor_phone: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">E-mail</span><input type="email" value={form.contractor_email || ''} onChange={(e) => patch({ contractor_email: e.target.value })} className={input} /></label>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">3. Dados da festa</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label><span className="text-sm font-medium">Aniversariante(s)</span><input value={form.celebrant_name || ''} onChange={(e) => patch({ celebrant_name: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Estimativa de crianças</span><input type="number" min="0" value={form.children_estimate || 0} onChange={(e) => patch({ children_estimate: Number(e.target.value) })} className={input} /></label>
                    <label><span className="text-sm font-medium">Faixa etária</span><input value={form.age_range || ''} onChange={(e) => patch({ age_range: e.target.value })} placeholder="Ex.: 4 a 8 anos" className={input} /></label>
                    <label><span className="text-sm font-medium">Tema</span><input value={form.event_theme || ''} onChange={(e) => patch({ event_theme: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Data</span><input type="date" value={form.event_date || ''} onChange={(e) => patch({ event_date: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Tipo de local</span><input value={form.event_location_type || ''} onChange={(e) => patch({ event_location_type: e.target.value })} placeholder="Residência, salão..." className={input} /></label>
                    <label><span className="text-sm font-medium">Início</span><input type="time" value={form.start_time || ''} onChange={(e) => patch({ start_time: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Término</span><input type="time" value={form.end_time || ''} onChange={(e) => patch({ end_time: e.target.value })} className={input} /></label>
                    <label className="sm:col-span-2"><span className="text-sm font-medium">Local do evento</span><input value={form.event_location || ''} onChange={(e) => patch({ event_location: e.target.value })} className={input} /></label>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between"><div><h3 className="font-semibold text-slate-900">4. Equipe, atividades e materiais</h3><p className="text-xs text-slate-500">O pacote preenche as atividades automaticamente, mas você pode ajustar.</p></div><input type="number" min="1" value={form.team_size} onChange={(e) => patch({ team_size: Number(e.target.value) })} className="input w-24" aria-label="Quantidade de recreadores" /></div>
                  <div className="mt-4 grid gap-5 md:grid-cols-2">
                    <div><div className="flex items-center justify-between"><span className="text-sm font-medium">Atividades inclusas</span><button type="button" onClick={() => addLine('included_activities')} className="text-xs font-semibold text-pink-600">+ adicionar</button></div><div className="mt-2 space-y-2">{form.included_activities.map((item, index) => <div key={index} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="flex-1">• {item}</span><button type="button" onClick={() => removeLine('included_activities', index)} className="text-slate-400 hover:text-red-500"><X size={14} /></button></div>)}</div></div>
                    <div><div className="flex items-center justify-between"><span className="text-sm font-medium">Equipamentos/materiais</span><button type="button" onClick={() => addLine('included_equipment')} className="text-xs font-semibold text-pink-600">+ adicionar</button></div><div className="mt-2 space-y-2">{form.included_equipment.map((item, index) => <div key={index} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="flex-1">• {item}</span><button type="button" onClick={() => removeLine('included_equipment', index)} className="text-slate-400 hover:text-red-500"><X size={14} /></button></div>)}</div></div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">5. Valores e pagamento</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label><span className="text-sm font-medium">Valor total</span><input type="number" step="0.01" value={form.total_amount} onChange={(e) => patch({ total_amount: Number(e.target.value) })} className={input} /></label>
                    <label><span className="text-sm font-medium">Sinal / reserva</span><input type="number" step="0.01" value={form.deposit_amount} onChange={(e) => patch({ deposit_amount: Number(e.target.value), balance_amount: Math.max(0, Number(form.total_amount) - Number(e.target.value)) })} className={input} /></label>
                    <label><span className="text-sm font-medium">Data do sinal</span><input type="date" value={form.deposit_date || ''} onChange={(e) => patch({ deposit_date: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Vencimento do saldo</span><input type="date" value={form.balance_due_date || ''} onChange={(e) => patch({ balance_due_date: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Saldo restante</span><input type="number" step="0.01" value={form.balance_amount} onChange={(e) => patch({ balance_amount: Number(e.target.value) })} className={input} /></label>
                    <label><span className="text-sm font-medium">Forma de pagamento</span><input value={form.payment_method || ''} onChange={(e) => patch({ payment_method: e.target.value })} className={input} /></label>
                    <label className="sm:col-span-2"><span className="text-sm font-medium">Chave PIX</span><input value={form.pix_key || company?.pix_key || ''} onChange={(e) => patch({ pix_key: e.target.value })} className={input} /></label>
                    <label className="sm:col-span-2"><span className="text-sm font-medium">Condições adicionais de pagamento</span><textarea value={form.additional_payment_terms || ''} onChange={(e) => patch({ additional_payment_terms: e.target.value })} className={textarea} /></label>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">6. Condições e observações</h3>
                  <div className="mt-4 space-y-4">
                    <label className="block"><span className="text-sm font-medium">Condições específicas do contrato</span><textarea value={form.contract_details || ''} onChange={(e) => patch({ contract_details: e.target.value })} placeholder="Ex.: regras específicas de cancelamento, remarcação ou contratação..." className={textarea} /></label>
                    <label className="block"><span className="text-sm font-medium">Observações adicionais</span><textarea value={form.additional_observations || ''} onChange={(e) => patch({ additional_observations: e.target.value })} placeholder="Tudo que foi combinado e precisa aparecer no contrato..." className={textarea + ' min-h-32'} /></label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm"><input type="checkbox" checked={form.catering_required} onChange={(e) => patch({ catering_required: e.target.checked })} /> Alimentação da equipe</label>
                      <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm"><input type="checkbox" checked={form.image_authorized} onChange={(e) => patch({ image_authorized: e.target.checked })} /> Autoriza uso de imagem</label>
                      <label><span className="text-sm font-medium">Antecedência de chegada</span><input type="number" min="0" value={form.arrival_minutes} onChange={(e) => patch({ arrival_minutes: Number(e.target.value) })} className={input} /></label>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="lg:sticky lg:top-0 lg:self-start">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between"><div><h3 className="font-semibold text-slate-900">Prévia do contrato</h3><p className="text-xs text-slate-500">O documento será gerado com estes dados.</p></div><button type="button" onClick={() => setPreview(!preview)} className="rounded-lg bg-white p-2 text-slate-600 shadow-sm"><Eye size={17} /></button></div>
                  <pre className={(preview ? 'mt-4 max-h-[65vh]' : 'mt-4 max-h-72') + ' overflow-auto whitespace-pre-wrap rounded-xl bg-white p-4 text-xs leading-5 text-slate-700 shadow-sm'}>{buildContractText(form, number, company)}</pre>
                </div>
              </aside>
            </div>

            {feedback && <div className="mt-5 rounded-xl bg-pink-50 px-4 py-3 text-sm font-medium text-pink-800">{feedback}</div>}
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button>
              <button type="button" onClick={() => navigator.clipboard?.writeText(buildContractText(form, number, company))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"><Copy size={16} /> Copiar texto</button>
              <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Salvando...' : <><CheckCircle2 size={17} /> Salvar contrato</>}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
