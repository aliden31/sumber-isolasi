
import { getCompanySettings } from '@/app/(app)/settings/actions';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';

export async function AppShell({ children }: { children: React.ReactNode }) {
  const settings = await getCompanySettings();

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <AppHeader companyName={settings.companyName} />
        <div className="flex flex-1">
          <AppSidebar companyName={settings.companyName} />
          {children}
        </div>
      </div>
    </>
  );
}
