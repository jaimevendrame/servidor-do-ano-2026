'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/lib/api';
import { getEleitor, clearSession } from '@/lib/session';
import type { Eleitor, Cedula } from '@/lib/types';

export default function SetorSemVotacaoPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [eleitor, setEleitor] = useState<Eleitor | null>(null);
  const [cedula, setCedula] = useState<Cedula | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const dados = getEleitor();
    if (!dados) {
      router.replace(`/${slug}/login`);
      return;
    }
    setEleitor(dados);

    (async () => {
      try {
        const response = await api.get<Cedula>(`/cedula/${dados.id}`);
        setCedula(response.data);

        if (response.data.votavel) {
          router.replace(`/${slug}/cedula`);
          return;
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
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const handleVoltar = () => {
    clearSession();
    router.push('/');
  };

  const mensagem =
    cedula?.motivo === 'SETOR_SEM_CANDIDATOS'
      ? 'Seu setor não possui candidatos inscritos nesta edição.'
      : cedula?.motivo === 'SETOR_COM_UM_CANDIDATO'
        ? 'Seu setor possui apenas um candidato inscrito, portanto não há votação.'
        : 'Não há cédula disponível para o seu setor nesta edição.';

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 py-12">
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200/50 bg-amber-50/50 p-6">
          <div className="text-center">
            <div className="mb-3 text-4xl">📋</div>
            <h1 className="text-2xl font-semibold text-amber-700">Setor sem votação</h1>
            <p className="mt-3 text-sm text-amber-600">{mensagem}</p>
          </div>
        </div>

        {eleitor && (
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Suas informações:</p>
            <p className="mt-2 text-base">
              <strong>{eleitor.nome}</strong>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Setor: {eleitor.setor}</p>
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <p>
            <strong>Por que isso acontece?</strong>
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
            <li>Setores com zero candidatos não geram cédula.</li>
            <li>Setores com candidato único também não votam — não há escolha a fazer.</li>
            <li>O regulamento da premiação define esses casos como &ldquo;sem votação&rdquo;.</li>
          </ul>
        </div>
      </div>

      {erro && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      <Button onClick={handleVoltar} size="lg" className="w-full">
        Voltar ao início
      </Button>
    </div>
  );
}
