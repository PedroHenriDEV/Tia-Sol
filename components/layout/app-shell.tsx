'use client';
import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-[var(--sidebar-width)]">
        <Header email={email} onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
