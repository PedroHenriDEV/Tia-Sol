import Image from 'next/image';
import Link from 'next/link';

type LogoVariant = 'sidebar' | 'login' | 'header' | 'mobile';

const sizes: Record<LogoVariant, { image: string; subtitle: string }> = {
  sidebar: { image: 'h-[78px] w-[126px]', subtitle: 'text-[10px]' },
  login: { image: 'h-[104px] w-[166px]', subtitle: 'text-[11px]' },
  header: { image: 'h-11 w-[68px]', subtitle: 'hidden' },
  mobile: { image: 'h-11 w-[68px]', subtitle: 'hidden' },
};

export function Logo({ variant = 'sidebar', linked = true }: { variant?: LogoVariant; linked?: boolean }) {
  const size = sizes[variant];
  const content = (
    <>
      <Image src="/Logo.jpg" alt="Logo Tia Sol Recreação" width={1536} height={1024} priority={variant === 'login' || variant === 'sidebar'} className={size.image + ' shrink-0 object-contain'} />
      {size.subtitle !== 'hidden' && <span className={'block leading-tight text-[var(--muted)] ' + size.subtitle}>Festas que viram memórias.</span>}
    </>
  );
  const node = <span className="inline-flex min-w-0 flex-col items-start">{content}</span>;
  return linked ? <Link href="/dashboard" aria-label="Tia Sol — início">{node}</Link> : node;
}
