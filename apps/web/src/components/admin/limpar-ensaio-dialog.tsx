'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { api, type ApiError } from '@/lib/api';
import { Trash2, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PreviaLimpeza {
  edicaoId: number;
  votos: number;
  participacoes: number;
  candidatos: number;
  eleitores: number;
  setores: number;
  atencao: string | null;
}

interface ResultadoLimpeza {
  edicaoId: number;
  votosRemovidos: number;
  participacoesRemovidas: number;
  candidatosPreservados: number;
  eleitoresPreservados: number;
  setoresPreservados: number;
}

interface LimparEnsaioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edicaoId: number;
  onLimpo: () => void;
}

/**
 * Limpeza de ensaio: apaga votos e participacoes da edicao, preservando
 * candidatos, eleitores, setores e a janela.
 */
export function LimparEnsaioDialog({
  open,
  onOpenChange,
  edicaoId,
  onLimpo,
}: LimparEnsaioDialogProps) {
  const [previa, setPrevia] = useState<PreviaLimpeza | null>(null);
  const [resultado, setResultado] = useState<ResultadoLimpeza | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [executando, setExecutando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPrevia = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await api.get<PreviaLimpeza>(`/admin/edicoes/${edicaoId}/limpeza-ensaio`);
      setPrevia(resp.data);
    } catch (err) {
      setErro((err as ApiError).message);
    } finally {
      setCarregando(false);
    }
  }, [edicaoId]);

  useEffect(() => {
    if (open) {
      setResultado(null);
      setErro(null);
      carregarPrevia();
    }
  }, [open, carregarPrevia]);

  const handleExecutar = async () => {
    const confirma = window.confirm(
      `Apagar ${previa?.votos ?? 0} votos e ${previa?.participacoes ?? 0} participações desta edição?\n\n` +
        `Serão PRESERVADOS: ${previa?.candidatos ?? 0} candidatos, ${previa?.eleitores ?? 0} eleitores e ${previa?.setores ?? 0} setores.`
    );
    if (!confirma) return;

    setExecutando(true);
    setErro(null);
    try {
      const resp = await api.post<ResultadoLimpeza>(`/admin/edicoes/${edicaoId}/limpeza-ensaio`);
      setResultado(resp.data);
      onLimpo();
    } catch (err) {
      setErro((err as ApiError).message);
    } finally {
      setExecutando(false);
    }
  };

  const handleClose = () => {
    setPrevia(null);
    setResultado(null);
    setErro(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Trash2 className="w-5 h-5 text-destructive" />
            Limpar votos de ensaio
          </DialogTitle>
        </DialogHeader>

        {erro && <Alert variant="error">{erro}</Alert>}

        {resultado ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-success/20 text-success flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Limpeza concluída</h3>
            <p className="text-sm text-muted-foreground">
              {resultado.votosRemovidos} votos e {resultado.participacoesRemovidas} participações
              removidos.
            </p>
            <p className="text-xs text-muted-foreground">
              Preservados: {resultado.candidatosPreservados} candidatos,{' '}
              {resultado.eleitoresPreservados} eleitores, {resultado.setoresPreservados} setores.
            </p>
          </div>
        ) : carregando ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
            Carregando...
          </div>
        ) : previa ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-center">
                <span className="text-xs text-destructive block">Votos a apagar</span>
                <span className="text-xl font-bold text-destructive">{previa.votos}</span>
              </div>
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-center">
                <span className="text-xs text-destructive block">Participações</span>
                <span className="text-xl font-bold text-destructive">{previa.participacoes}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-success/30 bg-success/5 space-y-1">
              <p className="text-xs font-medium text-success">Serão preservados:</p>
              <p className="text-sm text-foreground">
                {previa.candidatos} candidatos · {previa.eleitores} eleitores · {previa.setores}{' '}
                setores
              </p>
              <p className="text-xs text-muted-foreground">
                A janela de votação e a edição permanecem como estão.
              </p>
            </div>

            {previa.atencao && (
              <Alert variant="warning" className="text-xs">
                <ShieldAlert className="w-4 h-4 inline mr-1" />
                {previa.atencao}
              </Alert>
            )}
          </div>
        ) : null}

        <DialogFooter className="mt-4 border-t border-border pt-4">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          {!resultado && previa && (
            <Button
              variant="destructive"
              onClick={handleExecutar}
              disabled={executando || previa.votos === 0}
              className="flex items-center gap-2"
            >
              {executando && <RefreshCw className="w-4 h-4 animate-spin" />}
              {executando ? 'Limpando...' : 'Limpar votos'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
