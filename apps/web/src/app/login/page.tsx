'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, setToken, type ApiError } from '@/lib/api';
import { setEleitor } from '@/lib/session';
import { formatarCpf, validarCpf, limparCpf } from '@/lib/cpf';
import type { LoginEleitorDto, LoginResponseDto } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [cpf, setCpf] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [tentativas, setTentativas] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = formatarCpf(e.target.value);
    setCpf(valor);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    // Validar CPF no front antes de enviar
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
        dataAdmissao, // YYYY-MM-DD do input type="date"
      };

      const response = await api.post<LoginResponseDto>('/auth/eleitor/login', dto);

      // Sucesso: salvar token e dados do eleitor
      setToken(response.data.token);
      setEleitor(response.data.eleitor);

      // Redirecionar para confirmacao de identidade
      router.push('/confirmar');
    } catch (err) {
      const apiErr = err as ApiError;
      // Tentar extrair numero de tentativas da mensagem se estiver la
      if (apiErr.message.includes('Tentativa')) {
        const match = apiErr.message.match(/Tentativa (\d+) de 3/);
        if (match) {
          setTentativas(parseInt(match[1]));
        }
      }
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-primary">Eleitor</h1>
        <p className="text-sm text-muted-foreground">Informe seus dados para acessar a votacao</p>
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
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataAdmissao">Data de admissao</Label>
          <Input
            id="dataAdmissao"
            type="date"
            value={dataAdmissao}
            onChange={e => setDataAdmissao(e.target.value)}
            disabled={loading}
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Autenticando...' : 'Entrar'}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Vocé precisará do seu CPF e da data de admissão conforme registrado na empresa.
      </p>
    </div>
  );
}
