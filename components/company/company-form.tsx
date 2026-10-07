'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CreditCard, FileText, LoaderCircle, MapPin, Save, Wallet, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { companySchema, type CompanyInput } from '@/validators/company';
import { saveMyCompany } from '@/services/company';
import type { Company } from '@/types/database';
import { Logo } from '@/components/ui/logo';

const fieldClass = 'input mt-2';

export function CompanyForm({ company }: { company: Company | null }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      legal_name: company?.legal_name ?? '',
      trade_name: company?.trade_name ?? '',
      tax_id: company?.tax_id ?? '',
      phone: company?.phone ?? '',
      whatsapp: company?.whatsapp ?? '',
      email: company?.email ?? '',
      address: company?.address ?? '',
      city: company?.city ?? '',
      state: company?.state ?? '',
      description: company?.description ?? '',
      contract_details: company?.contract_details ?? '',
      bank_details: company?.bank_details ?? '',
      pix_key: company?.pix_key ?? '',
    },
  });

  async function onSubmit(data: CompanyInput) {
    setMessage('');

    try {
      await saveMyCompany(createClient(), data, company?.id);
      setMessage('Configurações salvas com sucesso.');
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Erro ao salvar.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Building2 size={19}/></span><div><h2 className="text-base font-semibold text-[var(--foreground)]">Identificação</h2><p className="mt-1 text-xs text-[var(--muted)]">Dados que aparecerão nos contratos e documentos.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          {([['legal_name','Nome da empresa / responsável *'],['trade_name','Nome comercial'],['tax_id','CPF ou CNPJ'],['email','E-mail'],['phone','Telefone'],['whatsapp','WhatsApp']] as const).map(([name,label]) => <label key={name} className="block"><span className="text-sm font-medium">{label}</span><input {...register(name)} className={fieldClass} placeholder={name==='legal_name' ? 'Ex.: Tia Sol Recreação' : undefined}/>{errors[name] && <span className="mt-1 block text-xs text-[var(--danger)]">{errors[name]?.message}</span>}</label>)}
        </div>
      </section>

      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--secondary-soft)] text-[var(--secondary)]"><MapPin size={19}/></span><div><h2 className="text-base font-semibold">Endereço</h2><p className="mt-1 text-xs text-[var(--muted)]">Informações de localização da contratada.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2"><label className="block md:col-span-2"><span className="text-sm font-medium">Endereço completo</span><input {...register('address')} className={fieldClass} placeholder="Rua, número, complemento e bairro"/></label><label className="block"><span className="text-sm font-medium">Cidade</span><input {...register('city')} className={fieldClass}/></label><label className="block"><span className="text-sm font-medium">Estado (UF)</span><input {...register('state')} maxLength={2} className={fieldClass} placeholder="SP"/></label></div>
      </section>

      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]"><CreditCard size={19}/></span><div><h2 className="text-base font-semibold">Recebimentos</h2><p className="mt-1 text-xs text-[var(--muted)]">Dados usados para facilitar cobranças e contratos.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2"><label className="block"><span className="text-sm font-medium">Chave PIX</span><input {...register('pix_key')} className={fieldClass} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"/></label><label className="block"><span className="text-sm font-medium">Dados bancários</span><textarea {...register('bank_details')} className="input mt-2 min-h-24 resize-y" placeholder="Banco, agência, conta e titular (opcional)"/></label></div>
      </section>

      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--warning)]"><FileText size={19}/></span><div><h2 className="text-base font-semibold">Contratos</h2><p className="mt-1 text-xs text-[var(--muted)]">Informações padrão inseridas na geração dos contratos.</p></div></div>
        <label className="block"><span className="text-sm font-medium">Dados e informações padrão do contrato</span><textarea {...register('contract_details')} className="input mt-2 min-h-40 resize-y" placeholder="Ex.: condições de pagamento, cancelamento, remarcação, responsabilidades, observações e demais cláusulas padrão."/></label>
      </section>

      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--muted)]/30 text-[var(--foreground)]"><MessageCircle size={19}/></span><div><h2 className="text-base font-semibold">Apresentação</h2><p className="mt-1 text-xs text-[var(--muted)]">Descrição utilizada quando o sistema precisar apresentar a recreação.</p></div></div>
        <textarea {...register('description')} className="input min-h-28 resize-y" placeholder="Ex.: Recreação infantil, festas, oficinas e atividades para eventos."/>
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border)] pt-5"><button disabled={isSubmitting} className="button-primary">{isSubmitting ? <LoaderCircle className="animate-spin" size={18}/> : <Save size={18}/>} Salvar configurações</button>{message && <p role="status" className={`text-sm ${message.includes('sucesso') ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>{message}</p>}</div>
    </form>
  );}
