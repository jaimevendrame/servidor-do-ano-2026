'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type ApiError } from '@/lib/api';
import type { EdicaoAtiva, StatusVotacao } from '@/lib/types';

const STATUS_LABEL: Record<StatusVotacao, { texto: string; classe: string }> = {
  aberta: { texto: 'Votação aberta', classe: 'bg-green-100 text-green-700 border-green-200' },
  em_breve: { texto: 'Em breve', classe: 'bg-amber-100 text-amber-700 border-amber-200' },
  encerrada: { texto: 'Encerrada', classe: 'bg-muted text-muted-foreground border-border' },
  sem_janela: {
    texto: 'Aguardando definição',
    classe: 'bg-muted text-muted-foreground border-border',
  },
};

function formatarVigencia(v: { dataInicio: string; dataFim: string } | null): string | null {
  if (!v) return null;
  const ini = new Date(v.dataInicio).toLocaleDateString('pt-BR');
  const fim = new Date(v.dataFim).toLocaleDateString('pt-BR');
  return ini === fim ? ini : `${ini} até ${fim}`;
}

export default function HomePage() {
  const [edicoes, setEdicoes] = useState<EdicaoAtiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get<EdicaoAtiva[]>('/edicoes/ativas');
        setEdicoes(resp.data);
      } catch (err) {
        setErro((err as ApiError).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-12">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl text-primary">Premiação Servidor do Ano</h1>
        <p className="text-base text-muted-foreground">
          Escolha a votação abaixo para participar. O sistema é anônimo, seguro e fiscalizado.
        </p>
      </div>

      {loading && <p className="text-center text-muted-foreground">Carregando votações...</p>}

      {erro && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
          {erro}
        </div>
      )}

      {!loading && !erro && edicoes.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhuma votação ativa no momento.
        </div>
      )}

      {!loading && edicoes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {edicoes.map(e => {
            const status = STATUS_LABEL[e.statusVotacao];
            const vigencia = formatarVigencia(e.vigencia);
            return (
              <Link
                key={e.id}
                href={`/${e.slug}/login`}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 transition hover:border-primary hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-primary">{e.nomePrefeitura}</p>
                    {e.cidade && <p className="text-sm text-muted-foreground">{e.cidade}</p>}
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${status.classe}`}
                  >
                    {status.texto}
                  </span>
                </div>

                <p className="text-sm font-medium text-foreground">Servidor do Ano {e.ano}</p>

                {e.descricao && <p className="text-sm text-muted-foreground">{e.descricao}</p>}

                {vigencia && (
                  <p className="text-xs text-muted-foreground">Período de votação: {vigencia}</p>
                )}

                <span className="mt-2 text-sm font-medium text-primary">Entrar para votar →</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50/50 p-4 text-center text-xs text-blue-700">
        Para votar, você precisará do seu CPF e da data de admissão conforme registrado na
        prefeitura.
      </div>

      <p className="text-center">
        <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-primary">
          Acessar painel administrativo
        </Link>
      </p>
    </div>
  );
}
