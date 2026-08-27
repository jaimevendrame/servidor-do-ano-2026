'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, type ApiError } from '@/lib/api';
import { setAdminToken, clearAdminSession } from '@/lib/session';
import type { LoginAdminDto, LoginAdminResponse } from '@/lib/types';

type Etapa = 'senha' | 'totp';

export default function AdminLoginPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>('senha');
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmitSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!username || !senha) {
      setErro('Informe usuario e senha.');
      return;
    }

    setLoading(true);
    try {
      const dto: LoginAdminDto = { username, senha };
      const response = await api.post<LoginAdminResponse>('/auth/admin/login', dto);

      if (response.data.totpRequired) {
        // Mudar para etapa 2 (TOTP)
        setEtapa('totp');
        setErro(null);
      } else if (response.data.token) {
        setAdminToken(response.data.token);
        router.push('/admin');
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!totpCode || totpCode.length !== 6) {
      setErro('Informe o codigo TOTP de 6 digitos.');
      return;
    }

    setLoading(true);
    try {
      const dto: LoginAdminDto = { username, senha, totpCode };
      const response = await api.post<LoginAdminResponse>('/auth/admin/login', dto);

      if (response.data.token) {
        setAdminToken(response.data.token);
        router.push('/admin');
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    setEtapa('senha');
    setTotpCode('');
    setErro(null);
    clearAdminSession();
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-primary">Painel administrativo</h1>
        <p className="text-sm text-muted-foreground">
          {etapa === 'senha' ? 'Informe suas credenciais' : 'Codigo de autenticacao'}
        </p>
      </div>

      {etapa === 'senha' ? (
        <form onSubmit={handleSubmitSenha} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              placeholder="******"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {erro && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmitTotp} className="space-y-4">
          <div className="rounded-lg border border-blue-200/50 bg-blue-50/50 p-4 text-sm text-blue-700">
            <p>
              Sua conta requer autenticacao em dois fatores. Abra o aplicativo autenticador e
              informe o codigo de 6 digitos.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totp">Codigo TOTP</Label>
            <Input
              id="totp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              autoComplete="one-time-code"
              className="text-center text-lg tracking-widest"
            />
          </div>

          {erro && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading || totpCode.length !== 6}>
              {loading ? 'Verificando...' : 'Confirmar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleVoltar}
              disabled={loading}
            >
              Voltar
            </Button>
          </div>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Acesso restrito a administradores autorizados.
      </p>
    </div>
  );
}
