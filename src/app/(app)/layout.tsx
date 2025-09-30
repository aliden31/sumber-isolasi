
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/app-shell";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getCompanySettings } from "@/app/(app)/settings/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getCompanySettings();
  
  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppShell companyName={settings.companyName}>{children}</AppShell>
      </TooltipProvider>
    </SidebarProvider>
  );
}
