'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, setToken, type ApiError } from '@/lib/api';
import { setEleitor, setEdicaoEleitor } from '@/lib/session';
import { formatarCpf, validarCpf, limparCpf } from '@/lib/cpf';
import type { LoginEleitorDto, LoginResponseDto, Edicao } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [edicaoErro, setEdicaoErro] = useState<string | null>(null);
  const [cpf, setCpf] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [tentativas, setTentativas] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolve o slug -> edição
  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get<Edicao>(`/edicoes/slug/${slug}`);
        setEdicao(resp.data);
      } catch {
        setEdicaoErro('Votação não encontrada. Verifique o endereço.');
      }
    })();
  }, [slug]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatarCpf(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!edicao) {
      setErro('Votação não carregada. Aguarde ou recarregue a página.');
      return;
    }

    if (!validarCpf(cpf)) {
      setErro('CPF invalido. Verifique os digitos.');
      return;
    }

    if (!dataAdmissao) {
      setErro('Informe a data de admissao.');
      return;
    }

    setLoading(true);

    try {
      const dto: LoginEleitorDto = {
        cpf: limparCpf(cpf),
        dataAdmissao,
        edicaoId: edicao.id,
      };

      const response = await api.post<LoginResponseDto>('/auth/eleitor/login', dto);

      setToken(response.data.token);
      setEleitor(response.data.eleitor);
      setEdicaoEleitor(edicao.id, slug);

      router.push(`/${slug}/confirmar`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.message.includes('Tentativa')) {
        const match = apiErr.message.match(/Tentativa (\d+) de 3/);
        if (match) setTentativas(parseInt(match[1]));
      }
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  };

  if (edicaoErro) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-4 py-12 text-center">
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {edicaoErro}
        </div>
        <Button variant="outline" onClick={() => router.push('/')} className="w-full">
          Ver votações disponíveis
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-primary">Eleitor</h1>
        {edicao ? (
          <p className="text-sm text-muted-foreground">
            {edicao.nomePrefeitura} — Servidor do Ano {edicao.ano}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Carregando votação...</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            type="text"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={handleCpfChange}
            disabled={loading || !edicao}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataAdmissao">Data de admissao</Label>
          <Input
            id="dataAdmissao"
            type="date"
            value={dataAdmissao}
            onChange={e => setDataAdmissao(e.target.value)}
            disabled={loading || !edicao}
          />
        </div>

        {erro && (
          <div className="space-y-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <p>{erro}</p>
            {tentativas && tentativas < 3 && (
              <p className="text-xs font-medium">
                Tentativa {tentativas} de 3. Apos 3 falhas, seu CPF sera bloqueado por 15 minutos.
              </p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading || !edicao}>
          {loading ? 'Autenticando...' : 'Entrar'}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Você precisará do seu CPF e da data de admissão conforme registrado na prefeitura.
      </p>
    </div>
  );
}
