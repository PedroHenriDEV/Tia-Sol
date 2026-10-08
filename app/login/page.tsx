import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/ui/logo';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[1.15fr_.85fr]">
      <section className="relative hidden overflow-hidden border-r bg-[var(--card)] px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16" style={{ borderColor: 'var(--border)' }}>
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[var(--accent-soft)]" />
        <div className="pointer-events-none absolute bottom-8 right-14 h-48 w-48 rounded-full border-[20px] border-[var(--primary-soft)]" />
        <div className="relative"><Logo variant="login" linked={false} /></div>
        <div className="relative max-w-xl pb-10">
          <p className="section-label">Recreação &amp; eventos</p>
          <h1 className="display-title mt-4 text-5xl leading-[1.04] xl:text-6xl">Festas bem cuidadas, do primeiro contato ao último detalhe.</h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-[var(--muted-foreground)]">Um espaço privado para organizar clientes, pacotes, eventos, agenda e tudo que faz uma celebração acontecer.</p>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-[var(--muted)]"><span className="h-2 w-2 rounded-full bg-[var(--secondary)]" />Acesso privado · Tia Sol</div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-9 lg:hidden"><Logo variant="login" linked={false} /></div>

          <div className="surface p-6 sm:p-8">
            <p className="section-label">Acesso privado</p>
            <h2 className="display-title mt-2 text-3xl">Bem-vinda de volta.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Entre com o e-mail e a senha cadastrados para acessar o sistema da Tia Sol.
            </p>

            <div className="mt-7">
              <Suspense><LoginForm /></Suspense>
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] text-[var(--muted)]">Seu espaço de organização para a Tia Sol.</p>
        </div>
      </section>
    </main>
  );
}
