import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'TIA SOL | Gestão de Eventos & Recreação',
  description: 'Gestão privada de eventos e recreação da Tia Sol',
  icons: {
    icon: '/Logo.jpg',
    shortcut: '/Logo.jpg',
    apple: '/Logo.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" className={`${jakarta.variable} ${fraunces.variable}`}><body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">{children}</body></html>;
}
