'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';

export function AppShell({
  children,
  companyName,
}: {
  children: React.ReactNode;
  companyName?: string;
}) {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <AppHeader companyName={companyName} />
        <div className="flex flex-1">
          <AppSidebar companyName={companyName} />
          <main className="flex-1 bg-background p-4 md:p-6 lg:p-8">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </>
  );
}
