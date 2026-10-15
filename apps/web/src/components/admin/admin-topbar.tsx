'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { resolveActiveNavItem } from './admin-nav-items';

interface AdminTopbarProps {
  onOpenMobile: () => void;
}

export function AdminTopbar({ onOpenMobile }: AdminTopbarProps) {
  const pathname = usePathname();
  const active = resolveActiveNavItem(pathname);
  const reduceMotion = useReducedMotion();
  const [refreshSignal, setRefreshSignal] = useState(0);

  // Escuta a revalidação de dados emitida pelas páginas (ex.: polling do painel).
  useEffect(() => {
    const onRefresh = () => setRefreshSignal(n => n + 1);
    window.addEventListener('admin:refresh', onRefresh);
    return () => window.removeEventListener('admin:refresh', onRefresh);
  }, []);

  const titulo = active?.label ?? 'Painel';
  const descricao = active?.description;

  return (
    <header className="glass-strong sticky top-0 z-20 flex items-center gap-3 px-4 py-3 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobile}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        {/* Breadcrumb */}
        <nav
          aria-label="trilha"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span>Admin</span>
          {active && active.href !== '/admin' && (
            <>
              <span aria-hidden="true">/</span>
              <span className="text-foreground/80">{active.label}</span>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <h1 className="truncate text-lg font-semibold text-primary">{titulo}</h1>
          {/* Pulse dourado ao revalidar dados */}
          {refreshSignal > 0 && (
            <motion.span
              key={refreshSignal}
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-secondary"
              initial={reduceMotion ? { opacity: 0.6 } : { opacity: 0.9, scale: 1 }}
              animate={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 2.2 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          )}
        </div>
      </div>

      {descricao && (
        <p className="hidden max-w-xs text-right text-xs text-muted-foreground lg:block">
          {descricao}
        </p>
      )}
    </header>
  );
}
