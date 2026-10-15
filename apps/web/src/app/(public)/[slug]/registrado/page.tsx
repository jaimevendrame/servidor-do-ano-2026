'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { getEleitor, getVotoRegistrado, clearSession } from '@/lib/session';
import { downloadComprovante } from '@/lib/download';
import type { Eleitor } from '@/lib/types';

export default function RegistradoPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [eleitor, setEleitor] = useState<Eleitor | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const dados = getEleitor();
    if (!dados) {
      router.replace(`/${slug}/login`);
      return;
    }

    const ts = getVotoRegistrado();
    if (!ts) {
      router.replace(`/${slug}/cedula`);
      return;
    }

    setEleitor(dados);
    setTimestamp(ts);
  }, [router, slug]);

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
        <div className="rounded-lg border border-success/30 bg-success/5 p-6 shadow-sm">
          <div className="space-y-3 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h1 className="font-heading text-2xl text-success">Voto registrado!</h1>
            <p className="text-sm text-success/90">
              Sua participação foi confirmada. Um comprovante foi gerado para sua referência.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
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

      {erro && <Alert variant="error">{erro}</Alert>}

      <div className="flex flex-col gap-3">
        <Button onClick={handleBaixarComprovante} disabled={baixando} size="lg" className="w-full">
          <Download className="h-5 w-5" />
          {baixando ? 'Baixando...' : 'Baixar comprovante em PDF'}
        </Button>
        <Button onClick={handleVoltar} variant="outline" size="lg" className="w-full">
          Voltar ao início
        </Button>
      </div>

      <Alert variant="info" className="text-center text-xs">
        <strong>Nota:</strong> O comprovante contém um código de verificação. Ele pode ser validado
        no painel administrativo após a apuração dos resultados.
      </Alert>
    </div>
  );
}
