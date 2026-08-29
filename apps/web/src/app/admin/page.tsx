'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/lib/api';
import { getAdminToken, clearAdminSession } from '@/lib/session';
import { useEdicao } from '@/lib/edicao-context';
import type { PainelAdmin, JanelaStatusApi } from '@/lib/types';

const REFRESH_INTERVAL_MS = 15000;

export default function AdminPage() {
  const router = useRouter();
  const { edicaoId } = useEdicao();
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
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, [edicaoId]);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace('/admin/login');
      return;
    }
    carregar();
    const interval = setInterval(carregar, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router, carregar]);

  const handleJanela = async (acao: 'abrir' | 'fechar') => {
    if (!edicaoId) return;

    const acaoLabel = acao === 'abrir' ? 'abrir' : 'fechar';
    if (!window.confirm(`Tem certeza que deseja ${acaoLabel} a votacao?`)) return;

    setAcaoJanela(acao);
    setErro(null);
    try {
      await api.put(`/janela/${edicaoId}/${acao}`, { ator: 'admin' });
      await carregar();
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setAcaoJanela(null);
    }
  };

  const handleSair = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 py-12 text-center">
        <p className="text-muted-foreground">Carregando painel...</p>
      </div>
    );
  }

  if (!edicaoId) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 py-12 text-center">
        <p className="text-destructive">Nenhuma eleição selecionada</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Painel administrativo</h1>
          <p className="text-sm text-muted-foreground">
            {painel && `Eleição ${painel.edicaoId === edicaoId ? painel.edicaoId : edicaoId}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSair}>
          Sair
        </Button>
      </div>

      {erro && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      {painel && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Total de eleitores</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{painel.totalEleitores}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Participaram</p>
            <p className="mt-2 text-3xl font-bold text-primary">{painel.totalParticiparam}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Percentual</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {painel.percentual.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {janela && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status da votacao</p>
              <p className="mt-1 text-lg font-semibold">
                {janela.aberta ? (
                  <span className="text-green-700">Aberta</span>
                ) : (
                  <span className="text-muted-foreground">Fechada</span>
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Janela: {new Date(janela.dataInicio).toLocaleString('pt-BR')} ate{' '}
                {new Date(janela.dataFim).toLocaleString('pt-BR')}
              </p>
              {janela.abertaManual && (
                <p className="mt-1 text-xs text-amber-600">Abertura manual ativa</p>
              )}
              {janela.fechadaManual && (
                <p className="mt-1 text-xs text-amber-600">Fechamento manual ativo</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleJanela('abrir')}
                disabled={acaoJanela !== null || janela.aberta}
                variant={janela.aberta ? 'outline' : 'default'}
              >
                {acaoJanela === 'abrir' ? 'Abrindo...' : 'Abrir votacao'}
              </Button>
              <Button
                onClick={() => handleJanela('fechar')}
                disabled={acaoJanela !== null || !janela.aberta}
                variant={janela.aberta ? 'destructive' : 'outline'}
              >
                {acaoJanela === 'fechar' ? 'Fechando...' : 'Fechar votacao'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50/50 p-4 text-xs text-blue-700">
        <p>
          <strong>Regra #1:</strong> durante a votacao, este painel exibe apenas o total de
          participacao. Nenhuma parcial de votos, ranking ou nome de candidato eh revelado.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Acoes administrativas</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Link
            href="/admin/importacao"
            className="rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:bg-accent"
          >
            <p className="font-semibold text-primary">Importacao XLS</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Carregar planilha do RH e normalizar setores
            </p>
          </Link>
          <Link
            href="/admin/candidatos"
            className="rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:bg-accent"
          >
            <p className="font-semibold text-primary">Candidatos</p>
            <p className="mt-1 text-xs text-muted-foreground">Gerenciar candidatos por setor</p>
          </Link>
          <Link
            href="/admin/eleitores"
            className="rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:bg-accent"
          >
            <p className="font-semibold text-primary">Eleitores</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Listar, bloquear e desbloquear eleitores
            </p>
          </Link>
          <Link
            href="/admin/apuracao"
            className="rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:bg-accent"
          >
            <p className="font-semibold text-primary">Apuracao</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Resultados por setor (apos fechamento)
            </p>
          </Link>
          <Link
            href="/admin/auditoria"
            className="rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:bg-accent"
          >
            <p className="font-semibold text-primary">Auditoria</p>
            <p className="mt-1 text-xs text-muted-foreground">Logs de acoes e exportacao CSV</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
