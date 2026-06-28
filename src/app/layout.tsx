import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/supabase/provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Global AI - Plataforma de Referidos",
  description: "Sistema de referidos con comisiones recurrentes. Gana dinero real compartiendo Global AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
