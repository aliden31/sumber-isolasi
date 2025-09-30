
'use client';

import { cn } from '@/lib/utils';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { TokoKilatLogo } from '../icons/logo';

export function AppHeader({ companyName }: { companyName: string }) {
  const { isMobile } = useSidebar();
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6'
      )}
    >
      <SidebarTrigger className="-ml-2" />

      <div className="flex items-center gap-2">
        <TokoKilatLogo />
        <span className="text-lg font-headline font-semibold text-primary">
          {companyName}
        </span>
      </div>
    </header>
  );
}
