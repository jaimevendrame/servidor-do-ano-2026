'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BrandLogo } from '@/components/brand-logo';
import { ArrowRight, Handshake } from 'lucide-react';
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
      {/* Hero compacto — o protagonismo é do card da votação */}
      <section className="flex flex-col items-center gap-3 pb-2 text-center">
        <BrandLogo variant="stacked" priority className="h-16 sm:h-20" />
        <p className="max-w-xl text-sm text-muted-foreground">
          Uma votação{' '}
          <span className="font-medium text-foreground">anônima, segura e fiscalizada</span>.
        </p>
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
          <div
            className={`grid gap-6 ${edicoes.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}
          >
            {edicoes.map(e => {
              const status = STATUS_LABEL[e.statusVotacao];
              const vigencia = formatarVigencia(e.vigencia);
              return (
                <Link
                  key={e.id}
                  href={`/${e.slug}/login`}
                  className={`group flex flex-col gap-4 rounded-xl border-2 border-secondary/40 bg-gradient-to-b from-card to-secondary/[0.06] p-7 shadow-md transition hover:border-secondary hover:shadow-lg ${
                    edicoes.length === 1 ? 'sm:p-9' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className={`font-heading text-primary ${edicoes.length === 1 ? 'text-2xl sm:text-3xl' : 'text-xl'}`}
                      >
                        {e.nomePrefeitura}
                      </p>
                      {e.cidade && <p className="mt-1 text-sm text-muted-foreground">{e.cidade}</p>}
                    </div>
                    <Badge variant={status.variant} className="shrink-0">
                      {status.texto}
                    </Badge>
                  </div>

                  <p className="text-base font-semibold text-foreground">Servidor do Ano {e.ano}</p>

                  {e.descricao && <p className="text-sm text-muted-foreground">{e.descricao}</p>}

                  {vigencia && (
                    <p className="text-xs text-muted-foreground">Período de votação: {vigencia}</p>
                  )}

                  <span className="mt-auto inline-flex items-center justify-center gap-2 rounded-md bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition group-hover:opacity-90">
                    Entrar para votar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Patrocinadores */}
          <div className="rounded-lg border border-border bg-card/60 px-6 py-6 text-center">
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Handshake className="h-3.5 w-3.5 text-secondary" />
              Patrocinadores
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
              <Image
                src="/patrocinadores/assercam.png"
                alt="Assercam"
                width={621}
                height={198}
                sizes="(max-width: 640px) 45vw, 180px"
                className="h-auto w-[180px] max-w-[45vw] object-contain"
              />
              <Image
                src="/patrocinadores/santander.jpg"
                alt="Santander"
                width={1500}
                height={786}
                sizes="(max-width: 640px) 45vw, 180px"
                className="h-auto w-[180px] max-w-[45vw] rounded-md object-contain"
              />
              <Image
                src="/patrocinadores/sindiscam.png"
                alt="Sindiscam"
                width={290}
                height={75}
                sizes="(max-width: 640px) 45vw, 160px"
                className="h-auto w-[160px] max-w-[45vw] object-contain"
              />
            </div>
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
