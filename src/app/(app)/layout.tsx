import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/app-shell";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getCompanySettings } from "./settings/actions";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const companySettings = await getCompanySettings();

  const coaSnapshot = await getDocs(query(collection(db, 'coa'), limit(1)));
  if (coaSnapshot.empty) {
    redirect('/setup');
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <TooltipProvider>
          <AppShell companyName={companySettings?.companyName || "Toko Kilat"}>{children}</AppShell>
        </TooltipProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
