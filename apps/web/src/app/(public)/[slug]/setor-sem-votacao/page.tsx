'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
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
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-6 shadow-sm">
          <div className="space-y-3 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-warning" />
            <h1 className="font-heading text-2xl text-warning">Setor sem votação</h1>
            <p className="text-sm text-warning/90">{mensagem}</p>
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

      {erro && <Alert variant="error">{erro}</Alert>}

      <Button onClick={handleVoltar} size="lg" className="w-full">
        Voltar ao início
      </Button>
    </div>
  );
}
