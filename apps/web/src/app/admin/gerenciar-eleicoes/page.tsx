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
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { api, type ApiError } from '@/lib/api';
import { getAdminToken } from '@/lib/session';
import { useEdicao } from '@/lib/edicao-context';
import type { EdicaoAtiva, StatusVotacao } from '@/lib/types';

const STATUS_BADGE: Record<StatusVotacao, { texto: string; variant: BadgeProps['variant'] }> = {
  aberta: { texto: 'Aberta', variant: 'success' },
  em_breve: { texto: 'Em breve', variant: 'warning' },
  encerrada: { texto: 'Encerrada', variant: 'neutral' },
  sem_janela: { texto: 'Sem janela', variant: 'neutral' },
};

function toLocalDatetimeInput(iso: string): string {
  // Converte ISO para formato YYYY-MM-DDTHH:MM esperado por <input type="datetime-local">
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function GerenciarEleicoesPage() {
  const router = useRouter();
  const { edicaoId, setEdicaoId } = useEdicao();
  const [edicoes, setEdicoes] = useState<EdicaoAtiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Modal state
  const [modalAberto, setModalAberto] = useState(false);
  const [edicaoSelecionada, setEdicaoSelecionada] = useState<EdicaoAtiva | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get<EdicaoAtiva[]>('/edicoes/ativas');
      setEdicoes(resp.data);
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace('/admin/login');
      return;
    }
    carregar();
  }, [router, carregar]);

  const abrirModal = (edicao: EdicaoAtiva) => {
    setEdicaoSelecionada(edicao);
    if (edicao.vigencia) {
      setDataInicio(toLocalDatetimeInput(edicao.vigencia.dataInicio));
      setDataFim(toLocalDatetimeInput(edicao.vigencia.dataFim));
    } else {
      // Defaults: hoje + 7 dias
      const now = new Date();
      const fim = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setDataInicio(toLocalDatetimeInput(now.toISOString()));
      setDataFim(toLocalDatetimeInput(fim.toISOString()));
    }
    setTimezone('America/Sao_Paulo');
    setErro(null);
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edicaoSelecionada) return;

    if (!dataInicio || !dataFim) {
      setErro('Data de início e fim são obrigatórias');
      return;
    }
    if (new Date(dataInicio) >= new Date(dataFim)) {
      setErro('Data de início deve ser anterior à data de fim');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      await api.put(`/janela/${edicaoSelecionada.id}/datas`, {
        dataInicio: new Date(dataInicio).toISOString(),
        dataFim: new Date(dataFim).toISOString(),
        timezone,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Eleições</h1>
        <p className="text-muted-foreground mt-1">
          Configurar datas de início e fim da janela de votação
        </p>
      </div>

      <Alert variant="info" className="text-xs">
        <strong>CRON ativo:</strong> a janela abre/fecha automaticamente a cada minuto com base nas
        datas abaixo. Após o fechamento (dataFim atingido), a votação não reabre.
      </Alert>

      {erro && <Alert variant="error">{erro}</Alert>}

      {loading ? (
        <div className="text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {edicoes.map(edicao => {
            const isSelected = edicao.id === edicaoId;
            return (
              <div
                key={edicao.id}
                className={`rounded-lg border p-4 transition ${
                  isSelected ? 'border-primary bg-accent' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{edicao.nomePrefeitura}</h3>
                      {isSelected && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                          Ativa
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {edicao.cidade} · Ano {edicao.ano} · /{edicao.slug}/login
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                      <div>
                        <span className="text-muted-foreground">Início:</span>{' '}
                        <span className="font-medium">
                          {edicao.vigencia
                            ? new Date(edicao.vigencia.dataInicio).toLocaleString('pt-BR')
                            : 'Não configurado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fim:</span>{' '}
                        <span className="font-medium">
                          {edicao.vigencia
                            ? new Date(edicao.vigencia.dataFim).toLocaleString('pt-BR')
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>{' '}
                        <Badge variant={STATUS_BADGE[edicao.statusVotacao].variant}>
                          {STATUS_BADGE[edicao.statusVotacao].texto}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button size="sm" onClick={() => abrirModal(edicao)}>
                      Configurar Datas
                    </Button>
                    {!isSelected && (
                      <Button size="sm" variant="outline" onClick={() => setEdicaoId(edicao.id)}>
                        Selecionar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de configuração de datas */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Janela de Votação</DialogTitle>
          </DialogHeader>

          {edicaoSelecionada && (
            <form onSubmit={handleSalvar} className="space-y-4">
              <div className="rounded-md bg-muted p-3 text-sm">
                <strong>{edicaoSelecionada.nomePrefeitura}</strong>
                <br />
                <span className="text-muted-foreground">{edicaoSelecionada.cidade}</span>
              </div>

              <div>
                <Label htmlFor="dataInicio">Data/Hora de Início</Label>
                <Input
                  id="dataInicio"
                  type="datetime-local"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dataFim">Data/Hora de Fim</Label>
                <Input
                  id="dataFim"
                  type="datetime-local"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="timezone">Fuso Horário</Label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                  <option value="America/Manaus">America/Manaus (AMT)</option>
                  <option value="America/Belem">America/Belem (BRT)</option>
                  <option value="America/Recife">America/Recife (BRT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <Alert variant="warning" className="text-xs">
                <strong>Atenção:</strong> se a votação já estiver sob controle manual
                (aberta/fechada manualmente), as datas não podem ser alteradas. Reative a janela
                automática primeiro (botão &quot;Abrir/Fechar&quot; no painel).
              </Alert>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar Datas'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
