import { cn } from '@/lib/utils';

interface AdminSkeletonProps {
  variant?: 'dashboard' | 'table' | 'cards';
  className?: string;
}

function Block({ className }: { className?: string }) {
  return <div className={cn('glass glass-shimmer rounded-lg', className)} aria-hidden="true" />;
}

/**
 * Placeholder liquidglass com shimmer para estados de carregamento.
 * Substitui os textos "Carregando..." das páginas admin.
 */
export function AdminSkeleton({ variant = 'cards', className }: AdminSkeletonProps) {
  if (variant === 'dashboard') {
    return (
      <div className={cn('space-y-6', className)} role="status" aria-label="Carregando painel">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Block className="h-28" />
          <Block className="h-28" />
          <Block className="h-28" />
        </div>
        <Block className="h-32" />
        <Block className="h-16" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-3', className)} role="status" aria-label="Carregando dados">
        <Block className="h-12" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Block key={i} className="h-14" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', className)}
      role="status"
      aria-label="Carregando"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Block key={i} className="h-40" />
      ))}
    </div>
  );
}
