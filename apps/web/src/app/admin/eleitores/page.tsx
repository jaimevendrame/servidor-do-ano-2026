'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api, type ApiError } from '@/lib/api';
import { getAdminToken } from '@/lib/session';
import { useEdicao } from '@/lib/edicao-context';
import type { SetorAdmin } from '@/lib/types';

interface Eleitor {
  id: number;
  cpf: string;
  nome: string;
  setorNome: string;
  dataAdmissao: string;
  status: 'ativo' | 'bloqueado';
  motivoBloqueio: string | null;
  dataBloqueio: string | null;
  criadoEm: string;
}

interface ListarResponse {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  eleitores: Eleitor[];
}

export default function EleitoresPage() {
  const router = useRouter();
  const { edicaoId } = useEdicao();
  const [eleitores, setEleitores] = useState<Eleitor[]>([]);
  const [setores, setSetores] = useState<SetorAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filtros
  const [status, setStatus] = useState<string>('');
  const [setorId, setSetorId] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);

  // Modal de bloqueio
  const [modalAberto, setModalAberto] = useState(false);
  const [eleitorSelecionado, setEleitorSelecionado] = useState<Eleitor | null>(null);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!edicaoId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        edicaoId: String(edicaoId),
        pagina: String(pagina),
        limite: '50',
      });
      if (status) params.append('status', status);
      if (setorId) params.append('setorId', setorId);
      if (busca) params.append('busca', busca);

      const resp = await api.get<ListarResponse>(`/admin/eleitores?${params}`);
      setEleitores(resp.data.eleitores);
      setTotal(resp.data.total);
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, [edicaoId, status, setorId, busca, pagina]);

  const carregarSetores = useCallback(async () => {
    if (!edicaoId) return;
    try {
      const resp = await api.get<SetorAdmin[]>(`/setores?edicaoId=${edicaoId}`);
      setSetores(resp.data);
    } catch (err) {
      console.error('Erro ao carregar setores:', err);
    }
  }, [edicaoId]);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace('/admin/login');
      return;
    }
    carregarSetores();
  }, [router, carregarSetores]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirModalBloquear = (eleitor: Eleitor) => {
    if (eleitor.status === 'bloqueado') {
      setErro('Eleitor já está bloqueado');
      return;
    }
    setEleitorSelecionado(eleitor);
    setMotivo('');
    setModalAberto(true);
  };

  const handleBloquear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eleitorSelecionado || !motivo.trim()) {
      setErro('Motivo do bloqueio é obrigatório');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      await api.put(`/admin/eleitores/${eleitorSelecionado.id}/bloquear`, {
        motivoBloqueio: motivo,
      });
      setModalAberto(false);
      carregar();
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDesbloquear = async (eleitor: Eleitor) => {
    if (eleitor.status === 'ativo') {
      setErro('Eleitor já está ativo');
      return;
    }

    try {
      await api.put(`/admin/eleitores/${eleitor.id}/desbloquear`);
      carregar();
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
  };

  const totalPaginas = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Eleitores</h1>
        <p className="text-muted-foreground mt-1">
          Listar, bloquear e desbloquear eleitores por edição
        </p>
      </div>

      {erro && <Alert variant="error">{erro}</Alert>}

      {/* Filtros */}
      <form onSubmit={handleBuscar} className="space-y-4 rounded-lg border p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="busca">Buscar (CPF ou Nome)</Label>
            <Input
              id="busca"
              placeholder="Ex: 123.456.789-00 ou João"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="setor">Setor</Label>
            <select
              id="setor"
              value={setorId}
              onChange={e => setSetorId(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              {setores.map(s => (
                <option key={s.id} value={String(s.id)}>
                  {s.nomeExibido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </div>
        </div>

        <Button type="submit" className="w-full md:w-auto">
          Buscar
        </Button>
      </form>

      {/* Tabela */}
      {loading ? (
        <div className="text-center text-muted-foreground">Carregando...</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">CPF</th>
                  <th className="px-4 py-3 text-left font-semibold">Nome</th>
                  <th className="px-4 py-3 text-left font-semibold">Setor</th>
                  <th className="px-4 py-3 text-left font-semibold">Admissão</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {eleitores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum eleitor encontrado
                    </td>
                  </tr>
                ) : (
                  eleitores.map(eleitor => (
                    <tr key={eleitor.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono">{eleitor.cpf}</td>
                      <td className="px-4 py-3">{eleitor.nome}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {eleitor.setorNome}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(eleitor.dataAdmissao).toLocaleDateString('pt-BR', {
                          timeZone: 'UTC',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={eleitor.status === 'ativo' ? 'success' : 'error'}>
                          {eleitor.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {eleitor.status === 'ativo' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => abrirModalBloquear(eleitor)}
                            >
                              Bloquear
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDesbloquear(eleitor)}
                            >
                              Desbloquear
                            </Button>
                          )}
                          {eleitor.motivoBloqueio && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title={eleitor.motivoBloqueio}
                              className="text-xs"
                            >
                              ℹ️
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {eleitores.length} de {total} eleitores
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina(Math.max(1, pagina - 1))}
                  disabled={pagina === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                    <Button
                      key={p}
                      variant={pagina === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPagina(p)}
                      className="min-w-10"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
                  disabled={pagina === totalPaginas}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Bloquear */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Eleitor</DialogTitle>
          </DialogHeader>

          {eleitorSelecionado && (
            <form onSubmit={handleBloquear} className="space-y-4">
              <div>
                <p className="text-sm font-medium">
                  {eleitorSelecionado.nome} ({eleitorSelecionado.cpf})
                </p>
                <p className="text-xs text-muted-foreground">{eleitorSelecionado.setorNome}</p>
              </div>

              <div>
                <Label htmlFor="motivo">Motivo do Bloqueio</Label>
                <textarea
                  id="motivo"
                  placeholder="Ex: Suspeita de fraude, dados inconsistentes..."
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  className="mt-1 flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" disabled={salvando}>
                  {salvando ? 'Bloqueando...' : 'Bloquear'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
