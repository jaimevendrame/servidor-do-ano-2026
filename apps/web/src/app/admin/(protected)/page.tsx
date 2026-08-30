'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { AdminSkeleton } from '@/components/admin/admin-skeleton';
import { api, type ApiError } from '@/lib/api';
import { useEdicao } from '@/lib/edicao-context';
import type { PainelAdmin, JanelaStatusApi } from '@/lib/types';

const REFRESH_INTERVAL_MS = 15000;

/** Notifica a topbar (pulse) que os dados do painel foram revalidados. */
function emitirRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('admin:refresh'));
}

const kpiHover = {
  rest: { y: 0 },
  hover: { y: -4 },
};

export default function AdminPainelPage() {
  const { edicaoId } = useEdicao();
  const reduceMotion = useReducedMotion();
  const [painel, setPainel] = useState<PainelAdmin | null>(null);
  const [janela, setJanela] = useState<JanelaStatusApi | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acaoJanela, setAcaoJanela] = useState<'abrir' | 'fechar' | null>(null);

  const carregar = useCallback(async () => {
    if (!edicaoId) return;

    try {
      const [painelResp, janelaResp] = await Promise.all([
        api.get<PainelAdmin>(`/admin/painel/${edicaoId}`),
        api.get<JanelaStatusApi>(`/janela/${edicaoId}`),
      ]);
      setPainel(painelResp.data);
      setJanela(janelaResp.data);
      setErro(null);
      emitirRefresh();
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, [edicaoId]);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [carregar]);

  const handleJanela = async (acao: 'abrir' | 'fechar') => {
    if (!edicaoId) return;

    const acaoLabel = acao === 'abrir' ? 'abrir' : 'fechar';
    if (!window.confirm(`Tem certeza que deseja ${acaoLabel} a votacao?`)) return;

    setAcaoJanela(acao);
    setErro(null);
    try {
      await api.put(`/janela/${edicaoId}/${acao}`, {});
      await carregar();
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setAcaoJanela(null);
    }
  };

  if (loading) {
    return <AdminSkeleton variant="dashboard" />;
  }

  if (!edicaoId) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <p className="text-destructive">Nenhuma eleição selecionada</p>
      </Card>
    );
  }

  const kpis = painel
    ? [
        { label: 'Total de eleitores', valor: painel.totalEleitores, accent: 'text-foreground' },
        { label: 'Participaram', valor: painel.totalParticiparam, accent: 'text-secondary' },
        {
          label: 'Percentual',
          valor: `${painel.percentual.toFixed(1)}%`,
          accent: 'text-foreground',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {erro && <Alert variant="error">{erro}</Alert>}

      {painel && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {kpis.map(kpi => (
            <motion.div
              key={kpi.label}
              variants={reduceMotion ? undefined : kpiHover}
              initial="rest"
              whileHover="hover"
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Card variant="glass" className="p-6 text-center">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className={`mt-2 text-3xl font-bold ${kpi.accent}`}>{kpi.valor}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {janela && (
        <Card variant="glass" className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status da votação</p>
              <div className="mt-1 text-lg font-semibold">
                <Badge variant={janela.aberta ? 'success' : 'neutral'}>
                  {janela.aberta ? 'ABERTA' : 'FECHADA'}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Janela: {new Date(janela.dataInicio).toLocaleString('pt-BR')} até{' '}
                {new Date(janela.dataFim).toLocaleString('pt-BR')}
              </p>
              {(janela.abertaManual || janela.fechadaManual) && (
                <Badge variant="warning" className="mt-2">
                  {janela.abertaManual ? 'Abertura manual' : 'Fechamento manual'}
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleJanela('abrir')}
                disabled={acaoJanela !== null || janela.aberta}
                variant={janela.aberta ? 'outline' : 'default'}
              >
                {acaoJanela === 'abrir' ? 'Abrindo...' : 'Abrir votação'}
              </Button>
              <Button
                onClick={() => handleJanela('fechar')}
                disabled={acaoJanela !== null || !janela.aberta}
                variant={janela.aberta ? 'destructive' : 'outline'}
              >
                {acaoJanela === 'fechar' ? 'Fechando...' : 'Fechar votação'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Alert variant="info" className="text-xs">
        <strong>Regra #1:</strong> durante a votação, este painel exibe apenas o total de
        participação. Nenhuma parcial de votos, ranking ou nome de candidato é revelado.
      </Alert>
    </div>
  );
}
