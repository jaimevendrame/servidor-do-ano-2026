'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getEleitor } from '@/lib/session';
import { clearSession } from '@/lib/session';
import type { Eleitor } from '@/lib/types';

export default function ConfirmarPage() {
  const router = useRouter();
  const [eleitor, setEleitor] = useState<Eleitor | null>(null);

  useEffect(() => {
    const dados = getEleitor();
    if (!dados) {
      router.replace('/login');
      return;
    }
    setEleitor(dados);
  }, [router]);

  if (!eleitor) {
    return null; // redirect em andamento
  }

  const handleSouEu = () => {
    router.push('/cedula');
  };

  const handleNaoSouEu = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-primary">Confirme sua identidade</h1>
        <p className="text-sm text-muted-foreground">Verifique se os dados abaixo sao seus</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-lg font-semibold text-foreground">{eleitor.nome}</p>
        <p className="mt-1 text-sm text-muted-foreground">Setor: {eleitor.setor}</p>
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={handleSouEu} size="lg" className="w-full">
          Sou eu — continuar
        </Button>
        <Button onClick={handleNaoSouEu} variant="outline" size="lg" className="w-full">
          Nao sou eu — voltar
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Se os dados nao conferem, clique em &ldquo;Nao sou eu&rdquo; e tente novamente com seus
        dados corretos.
      </p>
    </div>
  );
}
