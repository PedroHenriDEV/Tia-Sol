import { Construction } from 'lucide-react';

export default async function ComingSoon({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const title = module.charAt(0).toUpperCase() + module.slice(1);

  return (
    <div className="grid min-h-[55vh] place-items-center">
      <div className="max-w-lg px-5 py-10 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
          <Construction size={20} strokeWidth={1.8} />
        </span>
        <p className="section-label mt-5">Em preparação</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          Este módulo ainda não foi implementado. Nenhum dado simulado está sendo exibido.
        </p>
      </div>
    </div>
  );
}
