import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { SignupForm } from '@/components/auth/signup-form';

export default function CadastroPage() {
  const signupEnabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED !== 'false';

  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[1.15fr_.85fr]">
      <section className="relative hidden overflow-hidden border-r bg-[var(--card)] px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16" style={{ borderColor: 'var(--border)' }}>
        <Logo variant="login" linked={false} />
        <div className="max-w-xl pb-10">
          <p className="section-label">Acesso privado</p>
          <h1 className="display-title mt-4 text-5xl leading-[1.04]">Gestão exclusiva da Tia Sol.</h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-[var(--muted-foreground)]">Este sistema é privado e o cadastro de novos usuários pode ser desativado após a criação do acesso principal.</p>
        </div>
        <div className="text-xs text-[var(--muted)]">Acesso privado · Tia Sol</div>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-9 lg:hidden"><Logo variant="login" linked={false} /></div>
          <div className="surface p-6 sm:p-8">
            <p className="section-label">{signupEnabled ? 'Criar acesso' : 'Acesso privado'}</p>
            <h2 className="display-title mt-2 text-3xl">{signupEnabled ? 'Bem-vinda.' : 'Cadastro encerrado.'}</h2>
            {signupEnabled ? (
              <>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">Esse acesso será usado para entrar no sistema.</p>
                <div className="mt-7"><SignupForm /></div>
              </>
            ) : (
              <div className="mt-5 space-y-5">
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">O cadastro de novos usuários está desativado. Se você já possui acesso, entre normalmente.</p>
                <Link href="/login" className="button-primary inline-flex w-full justify-center">Ir para o login</Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
