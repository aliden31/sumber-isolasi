import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/layout/theme-provider";

export const metadata: Metadata = {
  title: "Toko Kilat",
  description: "Aplikasi kasir penjualan dan akuntansi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head />
      <body className={cn("font-body antialiased", "min-h-screen bg-background")}>
        <ThemeProvider>
            {children}
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
