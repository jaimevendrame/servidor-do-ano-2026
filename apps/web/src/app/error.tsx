'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an error reporting service
    console.error('Error caught by error boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="font-heading text-6xl font-bold text-destructive">Erro</p>
      <h1 className="text-2xl font-semibold text-primary">Algo deu errado</h1>

      <Alert variant="error" className="max-w-md">
        {error.message || 'Uma falha inesperada ocorreu.'}
      </Alert>

      <div className="flex gap-2">
        <Button onClick={() => reset()}>Tentar novamente</Button>
        <Button asChild variant="outline">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>

      {error.digest && <p className="text-xs text-muted-foreground">Erro ID: {error.digest}</p>}
    </div>
  );
}
