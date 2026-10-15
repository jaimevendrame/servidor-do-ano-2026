'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="font-heading text-6xl font-bold text-destructive">Erro Global</p>
        <h1 className="text-2xl font-semibold text-primary">Falha crítica</h1>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Uma falha crítica impede a renderização da página.
        </p>
        <Button onClick={() => reset()}>Recarregar</Button>
      </body>
    </html>
  );
}
