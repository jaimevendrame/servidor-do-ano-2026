import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Servidor do Ano 2026',
  description: 'Sistema de votação da premiação Servidor do Ano',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
