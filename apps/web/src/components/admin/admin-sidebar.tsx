'use client';

import { BrandLogo } from '@/components/brand-logo';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearAdminSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { EdicaoSelector } from '@/components/edicao-selector';
import { ADMIN_NAV_ITEMS, resolveActiveNavItem } from './admin-nav-items';

interface AdminSidebarProps {
  /** Estado do drawer no mobile (controlado pelo layout). */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const active = resolveActiveNavItem(pathname);

  const handleSair = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  return (
    <>
      {/* Overlay glass no mobile */}
      {mobileOpen && (
        <div
          className="glass fixed inset-0 z-30 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'glass-strong fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo + fechar (mobile) */}
        <div className="flex items-center justify-between px-4 py-5">
          <Link href="/admin" className="flex items-center" onClick={onCloseMobile}>
            <BrandLogo variant="line" priority className="h-8" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onCloseMobile}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {ADMIN_NAV_ITEMS.map(item => {
            const isActive = active?.href === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary/15 text-secondary'
                    : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
                )}
              >
                {/* Indicador dourado do item ativo */}
                {isActive && (
                  <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-secondary" />
                )}
                <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé: edição + tema + sair */}
        <div className="space-y-3 border-t border-[var(--glass-border)] px-3 py-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <EdicaoSelector />
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-foreground/70 hover:text-destructive"
            onClick={handleSair}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
}
