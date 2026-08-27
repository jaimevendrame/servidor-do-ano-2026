import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Servidor do Ano 2026',
  description: 'Sistema de votacao da premiacao Servidor do Ano',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <main className="container flex-1 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
