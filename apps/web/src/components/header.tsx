import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brasao.svg" alt="Brasao da Prefeitura" width={48} height={48} priority />
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Prefeitura</p>
            <p className="text-base font-semibold text-primary">Servidor do Ano 2026</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-foreground/80 hover:text-primary">
            Inicio
          </Link>
          <Link href="/admin/login" className="text-foreground/80 hover:text-primary">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
