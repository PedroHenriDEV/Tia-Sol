import { Logo } from '@/components/ui/logo';
import { SignupForm } from '@/components/auth/signup-form';

export default function CadastroPage() {
  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[1.15fr_.85fr]">
      <section className="relative hidden overflow-hidden border-r bg-[var(--card)] px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16" style={{ borderColor: 'var(--border)' }}>
        <Logo variant="login" linked={false} />
        <div className="max-w-xl pb-10">
          <p className="section-label">Primeiro acesso</p>
          <h1 className="display-title mt-4 text-5xl leading-[1.04]">Crie o acesso da Tia Sol.</h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-[var(--muted-foreground)]">Cadastre nome, e-mail e uma senha para proteger a gestão das suas festas.</p>
        </div>
        <div className="text-xs text-[var(--muted)]">Acesso privado · Tia Sol</div>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-9 lg:hidden"><Logo variant="login" linked={false} /></div>
          <div className="surface p-6 sm:p-8">
            <p className="section-label">Criar acesso</p>
            <h2 className="display-title mt-2 text-3xl">Bem-vinda.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">Esse acesso será usado para entrar no sistema.</p>
            <div className="mt-7"><SignupForm /></div>
          </div>
        </div>
      </section>
    </main>
  );
}
