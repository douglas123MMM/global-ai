import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/supabase/provider";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Global AI — Gana Dinero Real Compartiendo IA',
  description: 'Programa de afiliados con comisiones recurrentes del 20-25%. Retira tus ganancias por PayPal o Stripe. Multiples modelos de IA en un solo chat.',
  keywords: 'IA, inteligencia artificial, afiliados, ganar dinero, ChatGPT, Claude, referidos, comisiones',
  openGraph: {
    title: 'Global AI — Gana Dinero Real Compartiendo IA',
    description: 'Comisiones recurrentes del 20-25% cada mes. Retira por PayPal o Stripe.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased scrollbar-thin`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
