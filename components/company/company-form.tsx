'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { companySchema, type CompanyInput } from '@/validators/company';
import { saveMyCompany } from '@/services/company';
import type { Company } from '@/types/database';
import { Logo } from '@/components/ui/logo';

const fields = [
  ['legal_name', 'Nome da empresa *'],
  ['trade_name', 'Nome comercial'],
  ['tax_id', 'CPF/CNPJ'],
  ['phone', 'Telefone'],
  ['whatsapp', 'WhatsApp'],
  ['email', 'E-mail'],
  ['address', 'Endereço'],
  ['city', 'Cidade'],
  ['state', 'Estado'],
  ['pix_key', 'Chave PIX'],
] as const;

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
      <section aria-labelledby="company-data-heading">
        <div className="mb-5 border-b border-[var(--border)] pb-3">
          <h2 id="company-data-heading" className="text-base font-semibold text-[var(--foreground)]">Dados da empresa</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Informações de contato e localização.</p>
        </div>
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
          {fields.map(([name, label]) => (
            <label key={name} className={name === 'address' ? 'md:col-span-2' : 'block'}>
              <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
              <input {...register(name)} maxLength={name === 'state' ? 2 : undefined} className="input mt-2" />
              {errors[name] && <span className="mt-1 block text-xs text-[var(--danger)]">{errors[name]?.message}</span>}
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="company-details-heading">
        <div className="mb-5 border-b border-[var(--border)] pb-3">
          <h2 id="company-details-heading" className="text-base font-semibold text-[var(--foreground)]">Informações complementares</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Dados usados na apresentação e nos documentos da empresa.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-[var(--foreground)]">Descrição</span>
            <textarea {...register('description')} className="input mt-2 min-h-28 resize-y" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--foreground)]">Dados para contrato</span>
            <textarea {...register('contract_details')} className="input mt-2 min-h-28 resize-y" />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Dados bancários</span>
            <textarea {...register('bank_details')} className="input mt-2 min-h-24 resize-y" />
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="border-t border-[var(--border)] pt-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Identidade visual</h2>
          <div className="mt-4">
            <Logo variant="header" linked={false} />
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            A marca Tia Sol está aplicada na navegação. O envio ou a troca de arquivos de logo não está disponível neste formulário.
          </p>
        </div>

        <div className="border-t border-[var(--border)] pt-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Preferências</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Esta tela mantém as preferências atuais do sistema. Nenhuma configuração adicional é alterada aqui.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border)] pt-5">
        <button disabled={isSubmitting} className="button-primary">
          {isSubmitting ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
          Salvar configurações
        </button>

        {message && (
          <p role="status" className={`text-sm ${message.includes('sucesso') ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
