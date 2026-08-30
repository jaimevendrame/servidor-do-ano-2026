'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import type { BadgeProps } from '@/components/ui/badge';
import type { EdicaoAtiva, StatusVotacao } from '@/lib/types';

const STATUS_LABEL: Record<StatusVotacao, { texto: string; variant: BadgeProps['variant'] }> = {
  aberta: { texto: 'Votação aberta', variant: 'success' },
  em_breve: { texto: 'Em breve', variant: 'warning' },
  encerrada: { texto: 'Encerrada', variant: 'neutral' },
  sem_janela: { texto: 'Aguardando definição', variant: 'neutral' },
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
    <div className="mx-auto w-full max-w-4xl space-y-12 py-8">
      {/* Hero premium */}
      <section className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
        <Image
          src="/logo-alfa.png"
          alt="Servidor do Ano"
          width={200}
          height={110}
          priority
          className="h-24 w-auto"
        />
        <div className="space-y-3">
          <h1 className="font-heading text-primary">Servidor do Ano</h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground">
            Reconhecendo quem faz a diferença todos os dias. Uma votação{' '}
            <span className="font-medium text-foreground">anônima, segura e fiscalizada</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            Voto anônimo
          </span>
          <span className="inline-flex items-center gap-2">
            <Award className="h-4 w-4 text-secondary" />
            Reconhecimento institucional
          </span>
        </div>
      </section>

      {loading && <p className="text-center text-muted-foreground">Carregando votações...</p>}

      {erro && (
        <Alert variant="error" className="text-center">
          {erro}
        </Alert>
      )}

      {!loading && !erro && edicoes.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
          Nenhuma votação ativa no momento.
        </div>
      )}

      {!loading && edicoes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-center font-heading text-2xl text-primary">Votações disponíveis</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {edicoes.map(e => {
              const status = STATUS_LABEL[e.statusVotacao];
              const vigencia = formatarVigencia(e.vigencia);
              return (
                <Link
                  key={e.id}
                  href={`/${e.slug}/login`}
                  className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-sm transition hover:border-secondary hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold text-primary">{e.nomePrefeitura}</p>
                      {e.cidade && <p className="text-sm text-muted-foreground">{e.cidade}</p>}
                    </div>
                    <Badge variant={status.variant} className="shrink-0">
                      {status.texto}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-foreground">Servidor do Ano {e.ano}</p>

                  {e.descricao && <p className="text-sm text-muted-foreground">{e.descricao}</p>}

                  {vigencia && (
                    <p className="text-xs text-muted-foreground">Período de votação: {vigencia}</p>
                  )}

                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-secondary">
                    Entrar para votar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <Alert variant="info" className="text-center">
        Para votar, você precisará do seu CPF e da data de admissão conforme registrado na
        prefeitura.
      </Alert>

      <p className="text-center">
        <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-secondary">
          Acessar painel administrativo
        </Link>
      </p>
    </div>
  );
}
