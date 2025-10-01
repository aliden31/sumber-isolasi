
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/app-shell";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getCompanySettings } from "./settings/actions";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { getAuthenticatedUser } from "@/app/auth/get-authenticated-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  const companySettings = await getCompanySettings();
  const user = await getAuthenticatedUser();

  return (
    <ThemeProvider>
      <SidebarProvider>
        <TooltipProvider>
          <AppShell user={user} companyName={companySettings?.companyName || "Toko Kilat"}>{children}</AppShell>
        </TooltipProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
