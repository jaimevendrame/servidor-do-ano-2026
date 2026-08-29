'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/lib/api';
import { getEleitor, getVotoEscolhido, clearVotoEscolhido, setVotoRegistrado } from '@/lib/session';
import type { Eleitor, VotoResult } from '@/lib/types';

export default function ConfirmarVotoPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [eleitor, setEleitor] = useState<Eleitor | null>(null);
  const [candidatoNome, setCandidatoNome] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    const dados = getEleitor();
    if (!dados) {
      router.replace(`/${slug}/login`);
      return;
    }

    const voto = getVotoEscolhido();
    if (!voto) {
      router.replace(`/${slug}/cedula`);
      return;
    }

    setEleitor(dados);
    setCandidatoNome(voto.nome);
  }, [router, slug]);

  if (!eleitor || !candidatoNome) {
    return null;
  }

  const handleConfirmar = async () => {
    const voto = getVotoEscolhido();
    if (!voto || !eleitor) return;

    setConfirmando(true);
    try {
      const response = await api.post<VotoResult>('/voto', {
        eleitorId: eleitor.id,
        candidatoId: voto.id,
      });

      if (response.data.registradoEm) {
        setVotoRegistrado(new Date(response.data.registradoEm).toISOString());
      }

      clearVotoEscolhido();
      router.push(`/${slug}/registrado`);
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
      setConfirmando(false);
    }
  };

  const handleVoltar = () => {
    router.back();
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 py-12">
      <div className="space-y-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-primary">Confirme seu voto</h1>
          <p className="text-sm text-muted-foreground">Revise antes de confirmar</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Você está votando em:</p>
          <p className="mt-2 text-2xl font-bold text-primary">{candidatoNome}</p>
        </div>

        <div className="rounded-lg border-l-4 border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive">⚠ Atenção</p>
          <p className="mt-2 text-sm text-destructive">
            <strong>Esta ação é irreversível.</strong> Uma vez confirmado, seu voto não pode ser
            alterado ou cancelado. Certifique-se de estar votando no candidato correto.
          </p>
        </div>
      </div>

      {erro && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button onClick={handleConfirmar} disabled={confirmando} size="lg" className="w-full">
          {confirmando ? 'Registrando voto...' : 'Confirmar voto'}
        </Button>
        <Button
          onClick={handleVoltar}
          disabled={confirmando}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Voltar à cédula
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Ao confirmar, você receberá um comprovante de participação.
      </p>
    </div>
  );
}
