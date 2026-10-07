'use client';

import Link from 'next/link';
import * as React from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  MapPin,
  Package as PackageIcon,
  Phone,
  UserRound,
  WalletCards,
  Wrench,
  MessageCircle,
  ClipboardCheck,
  PlusCircle,
} from 'lucide-react';
import type { EventRecord } from '@/types/event';
import type { ContractRecord } from '@/types/contract';
import type { Material, MaterialMovement } from '@/types/inventory';
import type { EventInput } from '@/validators/event';
import type { FinancialTransaction } from '@/types/finance';
import { createClient } from '@/lib/supabase/client';
import { updateEvent } from '@/services/events';
import { createFinancialTransaction } from '@/services/finance';

type Props = {
  event: EventRecord;
  contracts: ContractRecord[];
  materials: Material[];
  movements: MaterialMovement[];
  payments: FinancialTransaction[];
};

const statusLabels: Record<EventRecord['status'], string> = {
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

const statusClasses: Record<EventRecord['status'], string> = {
  orcamento: 'bg-slate-100 text-slate-700',
  aguardando_confirmacao: 'bg-amber-50 text-amber-700',
  confirmado: 'bg-blue-50 text-blue-700',
  contrato_gerado: 'bg-violet-50 text-violet-700',
  contrato_assinado: 'bg-indigo-50 text-indigo-700',
  pagamento_parcial: 'bg-orange-50 text-orange-700',
  pagamento_completo: 'bg-emerald-50 text-emerald-700',
  realizado: 'bg-teal-50 text-teal-700',
  finalizado: 'bg-slate-100 text-slate-700',
  cancelado: 'bg-red-50 text-red-700',
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value + 'T12:00:00'));
}

function whatsappUrl(value: string | null | undefined, message: string) {
  const digits = (value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function Section({ icon: Icon, title, children }: { icon: typeof CalendarDays; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-pink-50 text-pink-600"><Icon size={18} /></span>
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || 'Não informado'}</p>
    </div>
  );
}

export function EventCentral({ event, contracts, materials, movements, payments }: Props) {
  const balance = Math.max(0, event.total_amount - event.received_amount);
  const paymentPercent = event.total_amount > 0 ? Math.min(100, (event.received_amount / event.total_amount) * 100) : 0;
  const contract = contracts[0] ?? null;
  const clientPhone = event.client?.whatsapp || event.client?.phone;
  const confirmUrl = whatsappUrl(clientPhone, `Olá, ${event.client?.name ?? ''}! Passando para confirmar o evento "${event.title}" no dia ${new Intl.DateTimeFormat('pt-BR').format(new Date(event.event_date + 'T12:00:00'))}, às ${event.start_time.slice(0, 5)}. Qualquer dúvida, estou à disposição!`);
  const paymentUrl = whatsappUrl(clientPhone, `Olá, ${event.client?.name ?? ''}! Sobre o evento "${event.title}", o valor total é ${money(event.total_amount)} e o saldo atual é ${money(balance)}. Podemos confirmar o pagamento?`);
  const movementMap = new Map(materials.map((material) => [material.id, material]));
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState(balance > 0 ? String(balance) : '');
  const [paymentMethod, setPaymentMethod] = React.useState('PIX');
  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [paymentSaving, setPaymentSaving] = React.useState(false);
  const [paymentFeedback, setPaymentFeedback] = React.useState<string | null>(null);

  async function registerPayment() {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) { setPaymentFeedback('Informe um valor de pagamento válido.'); return; }
    if (amount > balance) { setPaymentFeedback('O pagamento não pode ser maior que o saldo pendente.'); return; }
    setPaymentSaving(true); setPaymentFeedback(null);
    try {
      const newReceived = Number(event.received_amount) + amount;
      const nextStatus = newReceived >= Number(event.total_amount) && event.total_amount > 0 ? 'pagamento_completo' : 'pagamento_parcial';
      const input: EventInput = {
        title: event.title, client_id: event.client_id, package_id: event.package_id,
        event_date: event.event_date, start_time: event.start_time.slice(0, 5), end_time: event.end_time.slice(0, 5),
        location: event.location ?? '', status: nextStatus, total_amount: Number(event.total_amount),
        received_amount: newReceived, notes: event.notes ?? '',
      };
      const supabase = createClient();
      await createFinancialTransaction(supabase, {
        type: 'receita', event_id: event.id, description: 'Pagamento — ' + event.title,
        category: 'Evento', amount, due_date: paymentDate,
        paid_at: new Date(paymentDate + 'T12:00:00').toISOString(), status: 'pago',
        notes: 'Forma de pagamento: ' + paymentMethod,
      });
      await updateEvent(supabase, event.id, input);
      setPaymentFeedback('Pagamento registrado com sucesso. Atualize a página para conferir o novo saldo.');
      setPaymentAmount('');
      setTimeout(() => setPaymentOpen(false), 900);
    } catch (error) {
      setPaymentFeedback(error instanceof Error ? error.message : 'Não foi possível registrar o pagamento.');
    } finally { setPaymentSaving(false); }
  }

  const nextSteps = [
    !event.client_id ? 'Vincular um cliente ao evento' : null,
    !event.package_id ? 'Definir o pacote de recreação' : null,
    !contract ? 'Gerar o contrato' : contract.status !== 'assinado' ? 'Concluir a assinatura do contrato' : null,
    event.total_amount > event.received_amount ? 'Receber o saldo do evento' : null,
    movements.length === 0 ? 'Separar e registrar os materiais necessários' : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link href="/eventos" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={17} /> Voltar para eventos
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[event.status]}`}>{statusLabels[event.status]}</span>
              {event.package?.name && <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">{event.package.name}</span>}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{event.title}</h1>
            <p className="mt-1 text-sm capitalize text-slate-500">{dateLabel(event.event_date)} · {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {confirmUrl && <a href={confirmUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"><MessageCircle size={17} /> Confirmar no WhatsApp</a>}
            {balance > 0 && <button onClick={() => { setPaymentAmount(String(balance)); setPaymentFeedback(null); setPaymentOpen(true); }} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"><PlusCircle size={17} /> Registrar pagamento</button>}
            {paymentUrl && balance > 0 && <a href={paymentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100"><WalletCards size={17} /> Cobrar saldo</a>}
            <Link href="/contratos" className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"><FileText size={17} /> Contratos</Link>
          </div>
        </div>
      </div>

      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 sm:items-center sm:p-5">
          <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-pink-600">Financeiro do evento</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Registrar pagamento</h2><p className="mt-1 text-sm text-slate-500">Saldo atual: {money(balance)}</p></div><button onClick={() => setPaymentOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">×</button></div>
            <div className="mt-5 space-y-4">
              <label className="block"><span className="text-sm font-medium text-slate-700">Valor recebido *</span><input type="number" min="0.01" max={balance} step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-pink-400" /></label>
              <label className="block"><span className="text-sm font-medium text-slate-700">Forma de pagamento</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"><option>PIX</option><option>Dinheiro</option><option>Cartão</option><option>Transferência</option><option>Outro</option></select></label>
              <label className="block"><span className="text-sm font-medium text-slate-700">Data do pagamento</span><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" /></label>
              {paymentFeedback && <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{paymentFeedback}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => setPaymentOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={paymentSaving} onClick={registerPayment} className="rounded-xl bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{paymentSaving ? 'Registrando...' : 'Confirmar pagamento'}</button></div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-400">Valor do evento</p><p className="mt-1 text-xl font-semibold text-slate-900">{money(event.total_amount)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-400">Já recebido</p><p className="mt-1 text-xl font-semibold text-emerald-600">{money(event.received_amount)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-400">Saldo pendente</p><p className="mt-1 text-xl font-semibold text-amber-600">{money(balance)}</p></div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <Section icon={CalendarDays} title="Dados do evento">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Data" value={new Intl.DateTimeFormat('pt-BR').format(new Date(event.event_date + 'T12:00:00'))} />
              <Info label="Horário" value={`${event.start_time.slice(0, 5)} às ${event.end_time.slice(0, 5)}`} />
              <Info label="Local" value={event.location} />
              <Info label="Pacote" value={event.package?.name} />
              <Info label="Duração do pacote" value={event.package ? `${event.package.duration} hora(s)` : null} />
              <Info label="Valor do pacote" value={event.package ? money(event.package.price) : null} />
            </div>
            {event.notes && <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Observações</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{event.notes}</p></div>}
          </Section>

          <Section icon={UserRound} title="Cliente">
            {event.client ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Nome" value={event.client.name} />
                <Info label="Documento" value={event.client.document} />
                <Info label="Telefone" value={event.client.phone} />
                <Info label="WhatsApp" value={event.client.whatsapp} />
                <Info label="E-mail" value={event.client.email} />
                <Info label="Endereço" value={[event.client.address, event.client.city, event.client.state].filter(Boolean).join(', ')} />
              </div>
            ) : <p className="text-sm text-slate-500">Nenhum cliente está vinculado a este evento.</p>}
          </Section>

          <Section icon={PackageIcon} title="Pacote e atividades">
            {event.package ? (
              <div>
                {event.package.description && <p className="mb-4 text-sm leading-6 text-slate-600">{event.package.description}</p>}
                <div className="flex flex-wrap gap-2">
                  {event.package.activities.length ? event.package.activities.map((activity) => <span key={activity} className="rounded-full bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700">{activity}</span>) : <span className="text-sm text-slate-500">Nenhuma atividade cadastrada no pacote.</span>}
                </div>
                {event.package.notes && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Observações do pacote</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{event.package.notes}</p></div>}
              </div>
            ) : <p className="text-sm text-slate-500">Defina um pacote no cadastro do evento para centralizar as atividades.</p>}
          </Section>

          <Section icon={FileText} title="Contrato">
            {contract ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Info label="Contrato" value={`#${String(contract.contract_number).padStart(3, '0')}/${contract.contract_year}`} />
                  <Info label="Status" value={contract.status} />
                  <Info label="Valor contratado" value={money(contract.total_amount)} />
                </div>
                {contract.generated_text && <details className="rounded-xl border border-slate-200 bg-slate-50"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700">Visualizar contrato gerado</summary><pre className="max-h-[520px] overflow-auto whitespace-pre-wrap border-t border-slate-200 p-4 text-xs leading-5 text-slate-600">{contract.generated_text}</pre></details>}
              </div>
            ) : <div className="flex flex-col gap-3 rounded-xl bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-amber-800">Nenhum contrato vinculado</p><p className="mt-1 text-sm text-amber-700">Gere o contrato a partir do módulo de contratos.</p></div><Link href="/contratos" className="inline-flex w-fit items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"><FileText size={16} /> Abrir contratos</Link></div>}
          </Section>

          <Section icon={WalletCards} title="Histórico de pagamentos">
            {payments.length ? (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const method = payment.notes?.replace(/^Forma de pagamento:\s*/i, '') || 'Não informado';
                  return <div key={payment.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={18} /></div>
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">Pagamento recebido</p><p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat('pt-BR').format(new Date(payment.due_date + 'T12:00:00'))} · {method}</p></div>
                    <p className="text-base font-bold text-emerald-600">{money(Number(payment.amount))}</p>
                  </div>;
                })}
                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm"><span className="font-medium text-slate-600">Total registrado</span><strong className="text-slate-900">{money(payments.reduce((sum, item) => sum + Number(item.amount), 0))}</strong></div>
              </div>
            ) : <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Nenhum pagamento registrado para este evento ainda.</div>}
          </Section>

          <Section icon={Wrench} title="Materiais e estoque">
            {movements.length ? (
              <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs text-slate-400"><th className="pb-3 font-medium">Material</th><th className="pb-3 font-medium">Movimento</th><th className="pb-3 font-medium">Quantidade</th><th className="pb-3 font-medium">Estoque atual</th><th className="pb-3 font-medium">Motivo</th></tr></thead><tbody className="divide-y divide-slate-100">{movements.map((movement) => { const material = movementMap.get(movement.material_id); return <tr key={movement.id}><td className="py-3 font-medium text-slate-800">{material?.name ?? 'Material removido'}</td><td className="py-3 capitalize text-slate-600">{movement.type}</td><td className="py-3 text-slate-600">{movement.quantity} {material?.unit ?? ''}</td><td className="py-3 text-slate-600">{material ? `${material.quantity} ${material.unit}` : '—'}</td><td className="py-3 text-slate-500">{movement.reason}</td></tr>})}</tbody></table></div>
            ) : <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"><CircleAlert className="mt-0.5 text-slate-400" size={18} /><p className="text-sm text-slate-600">Ainda não há movimentações de estoque vinculadas a este evento.</p></div>}
          </Section>
        </div>

        <aside className="space-y-5">
          <Section icon={ClipboardCheck} title="Checklist do evento">
            <div className="space-y-3">
              {[
                { label: 'Cliente vinculado', done: Boolean(event.client_id) },
                { label: 'Pacote definido', done: Boolean(event.package_id) },
                { label: 'Contrato gerado', done: Boolean(contract) },
                { label: 'Contrato assinado', done: contract?.status === 'assinado' },
                { label: 'Pagamento concluído', done: event.total_amount > 0 && event.received_amount >= event.total_amount },
                { label: 'Materiais separados / registrados', done: movements.length > 0 },
                { label: 'Evento realizado', done: ['realizado', 'finalizado'].includes(event.status) },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  {item.done ? <CheckCircle2 size={18} className="shrink-0 text-emerald-500" /> : <CircleAlert size={18} className="shrink-0 text-amber-500" />}
                  <span className={item.done ? 'text-sm font-medium text-emerald-700 line-through' : 'text-sm font-medium text-slate-700'}>{item.label}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={WalletCards} title="Financeiro">
            <div className="space-y-4">
              <div><div className="flex justify-between text-xs font-medium text-slate-500"><span>Recebido</span><span>{Math.round(paymentPercent)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${paymentPercent}%` }} /></div></div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Total</span><strong className="text-slate-900">{money(event.total_amount)}</strong></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Recebido</span><strong className="text-emerald-600">{money(event.received_amount)}</strong></div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm"><span className="font-medium text-slate-700">Saldo</span><strong className="text-amber-600">{money(balance)}</strong></div>
              </div>
            </div>
          </Section>

          <Section icon={Phone} title="Contato rápido">
            <div className="space-y-2">
              {clientPhone ? <a href={`tel:${clientPhone}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><Phone size={17} className="text-slate-400" /> {clientPhone}</a> : <p className="text-sm text-slate-500">Telefone não informado.</p>}
              {confirmUrl && <a href={confirmUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"><MessageCircle size={17} /> Enviar confirmação pelo WhatsApp</a>}
            </div>
          </Section>

          <Section icon={Clock3} title="Próximos passos">
            {nextSteps.length ? <ul className="space-y-3">{nextSteps.map((step) => <li key={step} className="flex gap-2.5 text-sm text-slate-700"><CircleAlert className="mt-0.5 shrink-0 text-amber-500" size={17} /><span>{step}</span></li>)}</ul> : <div className="flex gap-2.5 text-sm font-medium text-emerald-700"><CheckCircle2 size={18} className="shrink-0" /> Tudo parece pronto para este evento.</div>}
          </Section>

          <Section icon={MapPin} title="Resumo operacional">
            <div className="space-y-3">
              <Info label="Status" value={statusLabels[event.status]} />
              <Info label="Cliente" value={event.client?.name} />
              <Info label="Equipe" value={event.package ? `${event.package.duration}h de pacote` : 'Definir pacote'} />
              <Info label="Local" value={event.location} />
            </div>
          </Section>
        </aside>
      </div>
    </div>
  );
}
