import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Beaver - Plataforma de Suporte para Arquitetura e Engenharia",
  description: "Plataforma moderna para gerenciamento e visualização de arquitetura de software.",
  authors: [
    {
      name: "Alexandre Nascimento",
      url: "https://github.com/alexandremn",
    }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          poppins.variable,
          "min-h-screen bg-background font-sans antialiased"
        )}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 