'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { CandidatoDetalhado, SetorAdmin } from '@/lib/types';

interface FormState {
  id?: number;
  nome: string;
  cargo: string;
  setorId: number | '';
  ordemExibicao: number;
}

const FORM_VAZIO: FormState = { nome: '', cargo: '', setorId: '', ordemExibicao: 0 };

export default function CandidatosPage() {
  const router = useRouter();
  const { edicaoId } = useEdicao();
  const [candidatos, setCandidatos] = useState<CandidatoDetalhado[]>([]);
  const [setores, setSetores] = useState<SetorAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!edicaoId) return;

    setLoading(true);
    try {
      const [candResp, setoresResp] = await Promise.all([
        api.get<CandidatoDetalhado[]>(`/candidatos?edicaoId=${edicaoId}`),
        api.get<SetorAdmin[]>(`/setores?edicaoId=${edicaoId}`),
      ]);
      setCandidatos(candResp.data);
      setSetores(setoresResp.data);
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, [edicaoId]);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace('/admin/login');
      return;
    }
    carregar();
  }, [router, carregar]);

  const abrirNovo = () => {
    setForm(FORM_VAZIO);
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEditar = (c: CandidatoDetalhado) => {
    setForm({
      id: c.id,
      nome: c.nome,
      cargo: c.cargo || '',
      setorId: c.setorId,
      ordemExibicao: c.ordemExibicao,
    });
    setErro(null);
    setDialogAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || form.setorId === '') {
      setErro('Nome e setor sao obrigatorios.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      if (form.id) {
        await api.put(`/candidatos/${form.id}`, {
          nome: form.nome,
          cargo: form.cargo || undefined,
          ordemExibicao: form.ordemExibicao,
        });
      } else {
        await api.post('/candidatos', {
          edicaoId: edicaoId || 1,
          setorId: form.setorId,
          nome: form.nome,
          cargo: form.cargo || undefined,
          ordemExibicao: form.ordemExibicao,
        });
      }
      setDialogAberto(false);
      await carregar();
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (c: CandidatoDetalhado) => {
    if (!window.confirm(`Remover o candidato "${c.nome}"?`)) return;
    try {
      await api.delete(`/candidatos/${c.id}`);
      await carregar();
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    }
  };

  // Agrupar candidatos por setor
  const porSetor = candidatos.reduce<Record<string, CandidatoDetalhado[]>>((acc, c) => {
    const nome = c.setor?.nomeExibido || `Setor ${c.setorId}`;
    if (!acc[nome]) acc[nome] = [];
    acc[nome].push(c);
    return acc;
  }, {});

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Candidatos</h1>
          <p className="text-sm text-muted-foreground">Cadastro por setor e ordem de exibicao</p>
        </div>
        <Button onClick={abrirNovo}>Novo candidato</Button>
      </div>

      {erro && !dialogAberto && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : candidatos.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhum candidato cadastrado ainda.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(porSetor).map(([setor, lista]) => (
            <div key={setor} className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold text-primary">{setor}</h2>
              <div className="space-y-2">
                {lista.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-md border border-border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        <span className="mr-2 text-xs text-muted-foreground">
                          #{c.ordemExibicao}
                        </span>
                        {c.nome}
                      </p>
                      {c.cargo && <p className="text-xs text-muted-foreground">{c.cargo}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEditar(c)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeletar(c)}>
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar candidato' : 'Novo candidato'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                disabled={salvando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo (opcional)</Label>
              <Input
                id="cargo"
                value={form.cargo}
                onChange={e => setForm({ ...form, cargo: e.target.value })}
                disabled={salvando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setor">Setor</Label>
              <select
                id="setor"
                value={form.setorId}
                onChange={e => setForm({ ...form, setorId: parseInt(e.target.value) })}
                disabled={salvando || !!form.id}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Selecione um setor</option>
                {setores.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nomeExibido}
                  </option>
                ))}
              </select>
              {form.id && (
                <p className="text-xs text-muted-foreground">
                  O setor nao pode ser alterado. Remova e recrie se necessario.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem de exibicao</Label>
              <Input
                id="ordem"
                type="number"
                min={0}
                value={form.ordemExibicao}
                onChange={e => setForm({ ...form, ordemExibicao: parseInt(e.target.value) || 0 })}
                disabled={salvando}
              />
            </div>

            {erro && dialogAberto && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {erro}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogAberto(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
