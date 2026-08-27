'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/lib/api';
import { getEleitor } from '@/lib/session';
import { setVotoEscolhido } from '@/lib/session';
import type { Eleitor, Cedula, JanelaStatus, StatusParticipacao } from '@/lib/types';

export default function CedulaPage() {
  const router = useRouter();
  const [eleitor, setEleitor] = useState<Eleitor | null>(null);
  const [cedula, setCedula] = useState<Cedula | null>(null);
  const [selectedCandidatoId, setSelectedCandidatoId] = useState<number | null>(null);
  const [tempoRestante, setTempoRestante] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [votando, setVotando] = useState(false);

  useEffect(() => {
    const dados = getEleitor();
    if (!dados) {
      router.replace('/login');
      return;
    }
    setEleitor(dados);

    // Carregar cedula
    (async () => {
      try {
        // Primeiro, verificar se ja votou
        const reentradaResp = await api.get<StatusParticipacao>(
          `/reentrada/${dados.id}?edicaoId=1`
        );

        if (reentradaResp.data.jaVotou) {
          router.replace('/ja-votou');
          return;
        }

        const response = await api.get<Cedula>(`/cedula/${dados.id}`);
        setCedula(response.data);

        // Se nao votavel, redirecionar para setor-sem-votacao
        if (!response.data.votavel) {
          router.replace('/setor-sem-votacao');
          return;
        }

        // Carregar janela para countdown
        const janelaResp = await api.get<JanelaStatus>('/janela/1');
        iniciarCountdown(janelaResp.data);
      } catch (err) {
        const apiErr = err as ApiError;
        setErro(apiErr.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function iniciarCountdown(janela: JanelaStatus) {
    const calcularTempo = () => {
      const agora = new Date();
      const fim = new Date(janela.fechaEm || '');
      const diff = fim.getTime() - agora.getTime();

      if (diff <= 0) {
        setTempoRestante(null);
        return;
      }

      const minutos = Math.floor(diff / 60000);
      const segundos = Math.floor((diff % 60000) / 1000);

      // Mostrar countdown so se faltam <=5 minutos
      if (minutos <= 5) {
        setTempoRestante(`${minutos}:${segundos.toString().padStart(2, '0')}`);
      } else {
        setTempoRestante(null);
      }
    };

    calcularTempo();
    const interval = setInterval(calcularTempo, 1000);
    return () => clearInterval(interval);
  }

  const handleVotar = async () => {
    if (!selectedCandidatoId || !cedula) return;

    const candidato = cedula.candidatos.find(c => c.id === selectedCandidatoId);
    if (!candidato) return;

    setVotando(true);
    try {
      // Salvar candidato escolhido e redirecionar para confirmacao
      setVotoEscolhido({ id: candidato.id, nome: candidato.nome });
      router.push('/confirmar-voto');
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
      setVotando(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 py-12 text-center">
        <p className="text-muted-foreground">Carregando cedula...</p>
      </div>
    );
  }

  if (!eleitor || !cedula) {
    return null;
  }

  if (erro) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 py-12">
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {erro}
        </div>
        <Button onClick={() => router.back()} variant="outline" className="w-full">
          Voltar
        </Button>
      </div>
    );
  }

  const candidatoSelecionado = cedula.candidatos.find(c => c.id === selectedCandidatoId);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-primary">Cedula de votacao</h1>
        <p className="text-sm text-muted-foreground">
          Escolha o candidato do setor <strong>{eleitor.setor}</strong>
        </p>
        {tempoRestante && (
          <p className="text-sm font-semibold text-destructive">Tempo restante: {tempoRestante}</p>
        )}
      </div>

      <div className="space-y-3">
        {cedula.candidatos.map(candidato => (
          <button
            key={candidato.id}
            onClick={() => setSelectedCandidatoId(candidato.id)}
            className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
              selectedCandidatoId === candidato.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`mt-1 h-5 w-5 rounded-full border-2 flex-shrink-0 ${
                  selectedCandidatoId === candidato.id
                    ? 'border-primary bg-primary'
                    : 'border-border'
                }`}
              />
              <div>
                <p className="font-semibold text-foreground">{candidato.nome}</p>
                {candidato.cargo && (
                  <p className="text-sm text-muted-foreground">{candidato.cargo}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={handleVotar}
        disabled={!selectedCandidatoId || votando}
        size="lg"
        className="w-full"
      >
        {votando ? 'Prosseguindo...' : `Votar em ${candidatoSelecionado?.nome || 'candidato'}`}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Voce sera solicitado a confirmar sua escolha na proxima tela.
      </p>
    </div>
  );
}
