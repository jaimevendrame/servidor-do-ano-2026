'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/lib/api';
import { getAdminToken } from '@/lib/session';
import { useEdicao } from '@/lib/edicao-context';
import type { ResultadoApuracao, ResultadoSetor } from '@/lib/types';

export default function ApuracaoPage() {
  const router = useRouter();
  const { edicaoId } = useEdicao();
  const [resultado, setResultado] = useState<ResultadoApuracao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!edicaoId) return;

    try {
      const resp = await api.get<ResultadoApuracao>(`/admin/apuracao/${edicaoId}`);
      setResultado(resp.data);
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
  }, [router, carregar]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 py-12 text-center">
        <p className="text-muted-foreground">Carregando apuracao...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Apuracao</h1>
          <p className="text-sm text-muted-foreground">Resultados por setor — Eleição {edicaoId}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin')}>
          Voltar ao painel
        </Button>
      </div>

      {erro && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      {resultado && !resultado.votacaoFechada && (
        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50/50 p-4 text-sm text-amber-700">
          <p>
            <strong>Votacao ainda aberta.</strong> A apuracao so esta disponivel apos o fechamento.
          </p>
        </div>
      )}

      {resultado && resultado.setores.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhum setor encontrado para apuracao.
        </div>
      )}

      {resultado &&
        resultado.setores.map((setor: ResultadoSetor) => (
          <SetorCard key={setor.setorId} setor={setor} />
        ))}

      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50/50 p-4 text-xs text-blue-700">
        <p>
          <strong>Regra #8:</strong> empates NAO sao resolvidos pelo sistema. O sistema apenas
          sinaliza. A resolucao cabe a comissao conforme regulamento.
        </p>
      </div>
    </div>
  );
}

function SetorCard({ setor }: { setor: ResultadoSetor }) {
  return (
    <div
      className={`rounded-lg border bg-card p-4 ${
        setor.empate ? 'border-amber-300' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-primary">{setor.setorNome}</h2>
        {setor.empate && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            EMPATE
          </span>
        )}
      </div>

      {setor.ranking.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Sem candidatos neste setor.</p>
      ) : (
        <div className="mt-3 space-y-1">
          {setor.ranking.map((c, i) => {
            const isVencedor = i === 0 && !setor.empate;
            const isEmpatado =
              setor.empate && setor.empatados.some(e => e.candidatoId === c.candidatoId);

            return (
              <div
                key={c.candidatoId}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                  isVencedor
                    ? 'bg-green-50 font-semibold text-green-700'
                    : isEmpatado
                      ? 'bg-amber-50 font-semibold text-amber-700'
                      : 'text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs text-muted-foreground">{i + 1}º</span>
                  <span>{c.nome}</span>
                  {c.cargo && <span className="text-xs text-muted-foreground">({c.cargo})</span>}
                </div>
                <span className="font-mono text-sm">
                  {c.votos} voto{c.votos !== 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {setor.empate && (
        <div className="mt-3 rounded-md border border-amber-200/50 bg-amber-50/50 p-3 text-xs text-amber-700">
          <strong>Empate detectado</strong> entre: {setor.empatados.map(e => e.nome).join(', ')} (
          {setor.empatados[0]?.votos} votos cada). Resolucao conforme regulamento da comissao.
        </div>
      )}
    </div>
  );
}
