'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getEleitor, getVotoRegistrado, clearSession } from '@/lib/session';
import { downloadComprovante } from '@/lib/download';
import type { Eleitor } from '@/lib/types';

export default function RegistradoPage() {
  const router = useRouter();
  const [eleitor, setEleitor] = useState<Eleitor | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const dados = getEleitor();
    if (!dados) {
      router.replace('/login');
      return;
    }

    const ts = getVotoRegistrado();
    if (!ts) {
      router.replace('/cedula');
      return;
    }

    setEleitor(dados);
    setTimestamp(ts);
  }, [router]);

  if (!eleitor || !timestamp) {
    return null;
  }

  const handleBaixarComprovante = async () => {
    setBaixando(true);
    try {
      await downloadComprovante(eleitor.id);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao baixar comprovante');
    } finally {
      setBaixando(false);
    }
  };

  const handleVoltar = () => {
    clearSession();
    router.push('/');
  };

  // Formatar timestamp para PT-BR
  const dataObj = new Date(timestamp);
  const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 py-12">
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200/50 bg-green-50/50 p-6">
          <div className="space-y-3">
            <div className="text-center">
              <div className="mb-3 text-4xl">✓</div>
              <h1 className="text-2xl font-semibold text-green-700">Voto registrado!</h1>
            </div>

            <p className="text-center text-sm text-green-600">
              Sua participacao foi confirmada. Um comprovante foi gerado para sua referencia.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Data e hora do registro:</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {dataFormatada} às {horaFormatada}
          </p>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            Eleitor: <strong>{eleitor.nome}</strong>
          </p>
          <p className="mt-1">
            Setor: <strong>{eleitor.setor}</strong>
          </p>
        </div>
      </div>

      {erro && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button onClick={handleBaixarComprovante} disabled={baixando} size="lg" className="w-full">
          {baixando ? 'Baixando...' : '📥 Baixar comprovante em PDF'}
        </Button>
        <Button onClick={handleVoltar} variant="outline" size="lg" className="w-full">
          Voltar ao início
        </Button>
      </div>

      <div className="rounded-lg border border-blue-200/50 bg-blue-50/50 p-4 text-center text-xs text-blue-700">
        <p>
          <strong>Nota:</strong> O comprovante contém um código de verificação. Ele pode ser
          validado no painel administrativo após a apuração dos resultados.
        </p>
      </div>
    </div>
  );
}
