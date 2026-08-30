import Link from 'next/link';
import { EdicaoSelector } from './edicao-selector';
import { ThemeToggle } from './theme-toggle';
import { BrandLogo } from './brand-logo';

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo variant="line" priority className="h-9" />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <EdicaoSelector />
          <Link href="/" className="text-foreground/80 hover:text-primary">
            Inicio
          </Link>
          <Link href="/admin/login" className="text-foreground/80 hover:text-primary">
            Admin
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
