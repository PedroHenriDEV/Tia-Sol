import Image from 'next/image';
import Link from 'next/link';

type LogoVariant = 'sidebar' | 'login' | 'header' | 'mobile';

const variantStyles: Record<LogoVariant, { image: string; title: string; subtitle: string }> = {
  sidebar: {
    image: 'h-[52px] w-[78px]',
    title: 'text-[17px]',
    subtitle: 'text-[9px]',
  },
  login: {
    image: 'h-[66px] w-[99px]',
    title: 'text-2xl',
    subtitle: 'text-[11px]',
  },
  header: {
    image: 'h-9 w-[54px]',
    title: 'text-sm',
    subtitle: 'text-[9px]',
  },
  mobile: {
    image: 'h-9 w-[54px]',
    title: 'text-sm',
    subtitle: 'hidden',
  },
};

export function Logo({ variant = 'sidebar', linked = true }: { variant?: LogoVariant; linked?: boolean }) {
  const styles = variantStyles[variant];
  const content = (
    <>
      <Image
        src="/Logo.jpg"
        alt="Logo Tia Sol Recreação"
        width={1536}
        height={1024}
        priority={variant === 'login' || variant === 'sidebar'}
        className={`${styles.image} shrink-0 object-contain`}
      />
      <span className="min-w-0">
        <span className={`block font-semibold leading-tight tracking-[0.04em] text-[var(--foreground)] ${styles.title}`}>
          TIA SOL
        </span>
        <span className={`mt-1 block leading-tight text-[var(--muted)] ${styles.subtitle}`}>
          Gestão de Eventos &amp; Recreação
        </span>
      </span>
    </>
  );

  const className = 'inline-flex min-w-0 items-center gap-2.5';

  return linked ? (
    <Link href="/dashboard" className={className} aria-label="Tia Sol — início">
      {content}
    </Link>
  ) : (
    <span className={className}>{content}</span>
  );
}
