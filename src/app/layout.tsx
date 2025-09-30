import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Alegreya, Belleza, Lora, Playfair_Display, Inter, Merriweather, Poppins, Montserrat } from "next/font/google";

const belleza = Belleza({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-belleza',
});

const alegreya = Alegreya({
  subsets: ['latin'],
  variable: '--font-alegreya',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-merriweather',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});


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
      <body className={cn(
          "font-body antialiased",
          "min-h-screen bg-background",
          belleza.variable,
          alegreya.variable,
          lora.variable,
          playfair.variable,
          inter.variable,
          merriweather.variable,
          poppins.variable,
          montserrat.variable
        )}>
        <ThemeProvider>
            {children}
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
