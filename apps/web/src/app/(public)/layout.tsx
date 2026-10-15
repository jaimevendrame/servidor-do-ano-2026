import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

/**
 * Layout das rotas públicas (landing + fluxo do eleitor em [slug]).
 * Renderiza o Header/Footer institucionais. A área /admin tem shell próprio.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">{children}</main>
      <Footer />
    </div>
  );
}
