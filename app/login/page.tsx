import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/ui/logo';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden border-r border-[var(--border)] bg-[var(--card)] px-12 py-10 lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 h-[430px] w-[430px] rounded-full border-[34px] border-[var(--primary-soft)]/80" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-14 right-16 h-16 w-16 rounded-full border-[10px] border-[var(--secondary)]/15" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-32 right-28 h-5 w-5 rounded-full bg-[var(--accent)]/50" />
        <div className="relative">
          <Logo variant="login" linked={false} />
        </div>

        <div className="relative max-w-xl pb-8">
          <p className="section-label">Gestão de Eventos &amp; Recreação</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.15] tracking-[-0.035em] text-[var(--foreground)] xl:text-5xl">
            Um cuidado especial em cada evento.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[var(--muted-foreground)]">
            Organize sua rotina e acompanhe os detalhes do seu trabalho em um só lugar.
          </p>
        </div>

        <p className="relative text-xs text-[var(--muted)]">Acesso privado • Tia Sol</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 lg:hidden">
            <Logo variant="login" linked={false} />
          </div>

          <div className="mb-8">
            <p className="section-label">Acesso privado</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
              Bem-vinda
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Entre com suas credenciais para acessar a gestão da Tia Sol.
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
