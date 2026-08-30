import type { Metadata } from 'next';
import { Inter, Oswald } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { EdicaoProvider } from '@/lib/edicao-context';
import { ThemeProvider, themeInitScript } from '@/lib/theme-context';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-oswald',
});

export const metadata: Metadata = {
  title: 'Servidor do Ano 2026',
  description: 'Sistema de votacao da premiacao Servidor do Ano',
  icons: {
    icon: '/favicon-servidordoano.jpg',
    apple: '/favicon-servidordoano.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${oswald.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <ThemeProvider>
          <EdicaoProvider>
            <Header />
            <main className="container flex-1 py-8">{children}</main>
            <Footer />
          </EdicaoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
