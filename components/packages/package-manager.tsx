'use client';

import { useRef, useState } from 'react';
import { CirclePlus, Pencil, Power, Save, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createPackage, togglePackageStatus, updatePackage } from '@/services/packages';
import type { Package } from '@/types/database';
import { packageSchema, type PackageInput } from '@/validators/package';

type PackageDraft = Omit<PackageInput, 'price' | 'duration'> & {
  price: string;
  duration: string;
};

const emptyForm: PackageDraft = {
  name: '',
  description: '',
  price: '',
  duration: '',
  activities: [],
  notes: '',
  active: true,
};

export function PackageManager({ initialPackages, error }: { initialPackages: Package[]; error?: string }) {
  const [packages, setPackages] = useState(initialPackages);
  const [draft, setDraft] = useState<PackageDraft>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingPackageId, setUpdatingPackageId] = useState<string | null>(null);
  const formPanelRef = useRef<HTMLElement>(null);

  function resetForm() {
    setDraft(emptyForm);
    setEditingId(null);
    setMessage('');
  }

  function startNewPackage() {
    resetForm();
    formPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function addActivity() {
    setDraft((current) => ({ ...current, activities: [...current.activities, ''] }));
  }

  function updateActivity(index: number, value: string) {
    setDraft((current) => ({
      ...current,
      activities: current.activities.map((item, activityIndex) => (activityIndex === index ? value : item)),
    }));
  }

  function removeActivity(index: number) {
    setDraft((current) => ({
      ...current,
      activities: current.activities.filter((_, activityIndex) => activityIndex !== index),
    }));
  }

  function startEdit(packageItem: Package) {
    setEditingId(packageItem.id);
    setDraft({
      name: packageItem.name,
      description: packageItem.description ?? '',
      price: packageItem.price > 0 ? String(packageItem.price) : '',
      duration: String(packageItem.duration),
      activities: Array.isArray(packageItem.activities) ? packageItem.activities : [],
      notes: packageItem.notes ?? '',
      active: packageItem.active,
    });
    setMessage('');
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');

    const normalized = {
      ...draft,
      price: draft.price.trim() || '0',
      activities: draft.activities.map((item) => item.trim()).filter(Boolean),
    };

    const validation = packageSchema.safeParse(normalized);
    if (!validation.success) {
      setMessage(validation.error.issues[0]?.message ?? 'Revise os dados do pacote.');
      return;
    }

    try {
      setIsSubmitting(true);
      const supabase = createClient();
      const payload = validation.data;

      if (editingId) {
        const updated = await updatePackage(supabase, editingId, payload);
        setPackages((current) => current.map((item) => (item.id === editingId ? updated : item)));
        resetForm();
        setMessage('Pacote atualizado com sucesso.');
      } else {
        const created = await createPackage(supabase, payload);
        setPackages((current) => [created, ...current]);
        resetForm();
        setMessage('Pacote cadastrado com sucesso.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar o pacote.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(packageId: string, active: boolean) {
    try {
      setUpdatingPackageId(packageId);
      const supabase = createClient();
      const updated = await togglePackageStatus(supabase, packageId, !active);
      setPackages((current) => current.map((item) => (item.id === packageId ? updated : item)));
      setMessage(`Pacote ${!active ? 'ativado' : 'desativado'} com sucesso.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível alterar o status do pacote.');
    } finally {
      setUpdatingPackageId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="section-label">Seu catálogo</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)] md:text-3xl">Serviços de recreação</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
            Cuide dos detalhes de cada experiência oferecida pela Tia Sol.
          </p>
        </div>

        <button type="button" className="button-primary w-full md:w-auto" onClick={startNewPackage}>
          <CirclePlus size={18} />
          Novo pacote
        </button>
      </div>

      {error ? <div className="feedback-error p-4">{error}</div> : null}

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] xl:gap-12">
        <section>
          {error ? null : packages.length === 0 ? (
            <div className="border-y border-[var(--border)] py-12 text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">Seu catálogo começa aqui</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
                Ainda não há pacotes cadastrados. Quando criar um, ele aparecerá nesta lista.
              </p>
            </div>
          ) : (
            <div className="border-t border-[var(--border)]">
              {packages.map((packageItem) => (
                <article key={packageItem.id} className="border-b border-[var(--border)] py-5 sm:py-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">{packageItem.name}</h2>
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                          <span className={`h-1.5 w-1.5 rounded-full ${packageItem.active ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'}`} />
                          {packageItem.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                        {packageItem.description || 'Sem descrição cadastrada.'}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0.5">
                      <p className="text-lg font-semibold text-[var(--foreground)]">
                        {packageItem.price > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(packageItem.price) : 'Valor a definir'}
                      </p>
                      <p className="text-sm text-[var(--muted)]">{packageItem.duration} horas</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="text-xs font-medium text-[var(--muted-foreground)]">
                      {packageItem.activities.length} {packageItem.activities.length === 1 ? 'atividade' : 'atividades'}
                    </span>
                    <p className="min-w-0 flex-1 text-xs text-[var(--muted)]" title={packageItem.activities.join(', ')}>
                      {packageItem.activities.join(' · ')}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button type="button" className="button-secondary" onClick={() => startEdit(packageItem)} disabled={Boolean(error)}>
                      <Pencil size={15} />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => handleToggleStatus(packageItem.id, packageItem.active)}
                      disabled={Boolean(error) || updatingPackageId === packageItem.id}
                    >
                      <Power size={15} />
                      {updatingPackageId === packageItem.id ? 'Atualizando...' : packageItem.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside ref={formPanelRef} className="scroll-mt-24 border-t border-[var(--border)] pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
          {error ? (
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Pacotes indisponíveis</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Não é possível cadastrar ou alterar pacotes enquanto os dados não puderem ser carregados.
                Verifique a migration e a conexão com o Supabase e tente novamente.
              </p>
            </div>
          ) : (
            <>
              <h2 id="package-form-heading" tabIndex={-1} className="text-xl font-semibold text-[var(--foreground)]">
                {editingId ? 'Editar pacote' : 'Novo pacote'}
              </h2>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Nome do pacote
                  <input
                    required
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    className="input mt-2"
                    placeholder="Festa Completa"
                  />
                </label>

                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Descrição
                  <textarea
                    value={draft.description}
                    onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                    className="input mt-2 min-h-24 resize-y"
                    placeholder="Descreva o pacote, o público e a proposta da experiência."
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-[var(--foreground)]">
                    Valor (opcional)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.price}
                      onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                      className="input mt-2"
                      placeholder="Deixe em branco para definir depois"
                    />
                  </label>

                  <label className="block text-sm font-medium text-[var(--foreground)]">
                    Duração (horas)
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={draft.duration}
                      onChange={(event) => setDraft((current) => ({ ...current, duration: event.target.value }))}
                      className="input mt-2"
                    />
                  </label>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--foreground)]">Atividades</span>
                    <button type="button" className="text-sm font-medium text-[var(--primary)]" onClick={addActivity}>
                      + Adicionar atividade
                    </button>
                  </div>

                  <div className="space-y-2">
                    {draft.activities.map((activity, index) => (
                      <div key={`${index}-${activity}`} className="flex gap-2">
                        <input
                          value={activity}
                          onChange={(event) => updateActivity(index, event.target.value)}
                          className="input"
                          placeholder="Ex.: Gincanas"
                        />
                        <button
                          type="button"
                          aria-label="Remover atividade"
                          className="rounded-xl border border-[var(--border)] p-2 text-[var(--muted)] hover:text-[var(--danger)]"
                          onClick={() => removeActivity(index)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Observações
                  <textarea
                    value={draft.notes}
                    onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                    className="input mt-2 min-h-24 resize-y"
                    placeholder="Informações relevantes para a operação do pacote."
                  />
                </label>

                <label className="flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))}
                    className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  Ativo
                </label>

                {message ? (
                  <p role="status" className={`text-sm ${message.includes('sucesso') ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {message}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="submit" className="button-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : <><Save size={18} /> {editingId ? 'Salvar alterações' : 'Salvar pacote'}</>}
                  </button>

                  <button type="button" className="button-secondary" onClick={resetForm}>
                    Limpar
                  </button>
                </div>
              </form>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
