'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './bottom-nav';

export function AppShell({
  children,
  email,
  fullName,
  avatarUrl,
}: {
  children: React.ReactNode;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-[var(--sidebar-width)]">
        <Header email={email} fullName={fullName} avatarUrl={avatarUrl} onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1580px] px-3 pb-24 pt-5 sm:px-6 sm:pt-8 lg:px-10 lg:pb-10 lg:pt-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
