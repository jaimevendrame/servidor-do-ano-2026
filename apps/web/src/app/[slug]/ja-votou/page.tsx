'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/lib/api';
import { getEleitor, getEdicaoEleitor, clearSession, setVotoRegistrado } from '@/lib/session';
import { downloadComprovante } from '@/lib/download';
import type { Eleitor, StatusParticipacao } from '@/lib/types';

export default function JaVotouPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [eleitor, setEleitor] = useState<Eleitor | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    const dados = getEleitor();
    const edicaoCtx = getEdicaoEleitor();
    if (!dados || !edicaoCtx) {
      router.replace(`/${slug}/login`);
      return;
    }
    setEleitor(dados);

    (async () => {
      try {
        const response = await api.get<StatusParticipacao>(
          `/reentrada/${dados.id}?edicaoId=${edicaoCtx.edicaoId}`
        );

        if (!response.data.jaVotou) {
          router.replace(`/${slug}/cedula`);
          return;
        }

        if (response.data.registradoEm) {
          setTimestamp(response.data.registradoEm);
          setVotoRegistrado(
            typeof response.data.registradoEm === 'string'
              ? response.data.registradoEm
              : new Date(response.data.registradoEm).toISOString()
          );
        }
      } catch (err) {
        const apiErr = err as ApiError;
        setErro(apiErr.message);
      } finally {
        setCarregando(false);
      }
    })();
  }, [router, slug]);

  if (carregando) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 py-12 text-center">
        <p className="text-muted-foreground">Verificando participacao...</p>
      </div>
    );
  }

  if (!eleitor) {
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

  const dataObj = timestamp ? new Date(timestamp) : null;
  const dataFormatada = dataObj
    ? dataObj.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const horaFormatada = dataObj
    ? dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 py-12">
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-200/50 bg-blue-50/50 p-6">
          <div className="text-center">
            <div className="mb-3 text-4xl">ℹ️</div>
            <h1 className="text-2xl font-semibold text-blue-700">Você já votou</h1>
            <p className="mt-3 text-sm text-blue-600">
              Sua participação nesta edição já foi registrada. Cada eleitor pode votar apenas uma
              vez.
            </p>
          </div>
        </div>

        {dataFormatada && horaFormatada && (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Data e hora do voto:</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {dataFormatada} às {horaFormatada}
            </p>
          </div>
        )}

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
          {baixando ? 'Baixando...' : '📥 Baixar comprovante'}
        </Button>
        <Button onClick={handleVoltar} variant="outline" size="lg" className="w-full">
          Voltar ao início
        </Button>
      </div>
    </div>
  );
}
