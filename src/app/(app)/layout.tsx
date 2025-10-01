import { AuthGuard } from "@/components/layout/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { getCompanySettings } from "./settings/actions";


export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  const companySettings = await getCompanySettings();

  return (
      <AuthGuard>
        <AppShell companyName={companySettings?.companyName || "Toko Kilat"}>{children}</AppShell>
      </AuthGuard>
  );
}
