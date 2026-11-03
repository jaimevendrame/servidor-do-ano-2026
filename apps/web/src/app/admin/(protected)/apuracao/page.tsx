'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trophy, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminSkeleton } from '@/components/admin/admin-skeleton';
import { api, type ApiError } from '@/lib/api';
import { downloadApuracaoExcel } from '@/lib/download';
import { useEdicao } from '@/lib/edicao-context';
import type { ResultadoApuracao, ResultadoSetor } from '@/lib/types';

export default function ApuracaoPage() {
  const { edicaoId } = useEdicao();
  const [resultado, setResultado] = useState<ResultadoApuracao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

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
    carregar();
  }, [carregar]);

  const handleExportarExcel = async () => {
    if (!edicaoId) return;
    setExportando(true);
    try {
      await downloadApuracaoExcel(edicaoId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao exportar Excel');
    } finally {
      setExportando(false);
    }
  };

  if (loading) {
    return <AdminSkeleton variant="cards" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl text-primary">Apuração dos Votos</h1>
          <p className="text-sm text-muted-foreground">
            Resultado oficial e ranking dos candidatos por setor após fechamento da votação.
          </p>
        </div>
        {resultado && resultado.votacaoFechada && (
          <Button
            variant="outline"
            onClick={handleExportarExcel}
            disabled={exportando}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            {exportando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{exportando ? 'Exportando...' : 'Exportar Excel (.xlsx)'}</span>
          </Button>
        )}
      </div>

      {erro && <Alert variant="error">{erro}</Alert>}

      {resultado && !resultado.votacaoFechada && (
        <Alert variant="warning">
          <strong>Votação ainda aberta.</strong> A apuração só está disponível após o fechamento.
        </Alert>
      )}

      {resultado && resultado.setores.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhum setor encontrado para apuração.
        </Card>
      )}

      {resultado &&
        resultado.setores.map((setor: ResultadoSetor) => (
          <SetorCard key={setor.setorId} setor={setor} />
        ))}

      <Alert variant="info" className="text-xs">
        <strong>Regra #8:</strong> empates NÃO são resolvidos pelo sistema. O sistema apenas
        sinaliza. A resolução cabe à comissão conforme regulamento.
      </Alert>
    </div>
  );
}

function SetorCard({ setor }: { setor: ResultadoSetor }) {
  return (
    <Card className={setor.empate ? 'border-warning/40' : undefined}>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg text-primary">{setor.setorNome}</h2>
        {setor.empate && <Badge variant="warning">EMPATE</Badge>}
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
                    ? 'bg-award/10 font-semibold text-award'
                    : isEmpatado
                      ? 'bg-warning/10 font-semibold text-warning'
                      : 'text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isVencedor ? (
                    <Trophy className="h-4 w-4 shrink-0 text-award" />
                  ) : (
                    <span className="w-6 text-center text-xs text-muted-foreground">{i + 1}º</span>
                  )}
                  <span>{c.nome}</span>
                  {c.cargo && <span className="text-xs text-muted-foreground">({c.cargo})</span>}
                  {isVencedor && (
                    <Badge variant="award" className="ml-1">
                      VENCEDOR
                    </Badge>
                  )}
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
        <Alert variant="warning" className="mt-3 text-xs">
          <strong>Empate detectado</strong> entre: {setor.empatados.map(e => e.nome).join(', ')} (
          {setor.empatados[0]?.votos} votos cada). Resolução conforme regulamento da comissão.
        </Alert>
      )}
    </Card>
  );
}
