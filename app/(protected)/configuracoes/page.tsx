import { createClient } from '@/lib/supabase/server';
import { getMyCompany } from '@/services/company';
import { CompanyForm } from '@/components/company/company-form';
import { BackupExport } from '@/components/backup/backup-export';

export default async function SettingsPage() {
  const supabase = await createClient();
  let company = null;
  let error = '';

  try {
    company = await getMyCompany(supabase);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Não foi possível carregar a empresa.';
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="section-label">Perfil da empresa</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)] md:text-3xl">
          Dados da empresa
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Os dados são persistidos no Supabase e protegidos por políticas RLS.
        </p>
      </div>

      {error ? (
        <div className="feedback-error p-4">
          {error}
        </div>
      ) : (
        <>
          <section className="border-t border-[var(--border)] pt-6">
            <CompanyForm company={company} />
          </section>
          <BackupExport />
        </>
      )}
    </div>
  );
}
