'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { api, type ApiError } from '@/lib/api';
import type { ResultadoPreviewCandidatos } from '@/lib/types';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

interface ImportarCandidatosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edicaoId: number;
  onImportadoSucesso: () => void;
}

export function ImportarCandidatosDialog({
  open,
  onOpenChange,
  edicaoId,
  onImportadoSucesso,
}: ImportarCandidatosDialogProps) {
  const [passo, setPasso] = useState<'upload' | 'preview' | 'sucesso'>('upload');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregandoPreview, setCarregandoPreview] = useState(false);
  const [carregandoImportacao, setCarregandoImportacao] = useState(false);
  const [baixandoModelo, setBaixandoModelo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [preview, setPreview] = useState<ResultadoPreviewCandidatos | null>(null);
  const [substituirExistentes, setSubstituirExistentes] = useState(false);
  const [totalImportados, setTotalImportados] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetar = () => {
    setPasso('upload');
    setArquivo(null);
    setErro(null);
    setPreview(null);
    setSubstituirExistentes(false);
    setTotalImportados(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetar();
    onOpenChange(false);
  };

  const handleDownloadModelo = async () => {
    try {
      setBaixandoModelo(true);
      setErro(null);
      const response = await api.get(`/candidatos/modelo-planilha?edicaoId=${edicaoId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `modelo_candidatos_edicao_${edicaoId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message || 'Erro ao baixar o modelo de planilha.');
    } finally {
      setBaixandoModelo(false);
    }
  };

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setArquivo(f);
      setErro(null);
    }
  };

  const handleAnalisarArquivo = async () => {
    if (!arquivo) {
      setErro('Selecione um arquivo de planilha (.xlsx ou .xls).');
      return;
    }

    setCarregandoPreview(true);
    setErro(null);

    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);

      const resp = await api.post<ResultadoPreviewCandidatos>(
        `/candidatos/upload-preview?edicaoId=${edicaoId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setPreview(resp.data);
      setPasso('preview');
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message || 'Falha ao processar o arquivo.');
    } finally {
      setCarregandoPreview(false);
    }
  };

  const handleConfirmarImportacao = async () => {
    if (!preview) return;

    const candidatosValidos = preview.itens
      .filter(item => (item.status === 'valido' || item.status === 'aviso') && item.setorId)
      .map(item => ({
        nome: item.nome,
        cargo: item.cargo,
        setorId: item.setorId!,
        eleitorId: item.eleitorId,
        ordemExibicao: item.ordemExibicao,
      }));

    if (candidatosValidos.length === 0) {
      setErro('Nenhum candidato válido para importar.');
      return;
    }

    if (substituirExistentes) {
      const confirma = window.confirm(
        'Atenção: Você marcou para substituir os candidatos existentes desta edição. Todos os candidatos atuais sem votos serão excluídos. Deseja prosseguir?'
      );
      if (!confirma) return;
    }

    setCarregandoImportacao(true);
    setErro(null);

    try {
      const resp = await api.post<{ totalImportados: number }>('/candidatos/importar', {
        edicaoId,
        substituirExistentes,
        candidatos: candidatosValidos,
      });

      setTotalImportados(resp.data.totalImportados);
      setPasso('sucesso');
      onImportadoSucesso();
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message || 'Erro ao importar candidatos.');
    } finally {
      setCarregandoImportacao(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileSpreadsheet className="w-5 h-5 text-accent" />
            Importar Candidatos via Planilha (Excel)
          </DialogTitle>
        </DialogHeader>

        {erro && (
          <Alert variant="error" className="my-2">
            {erro}
          </Alert>
        )}

        {/* PASSO 1: UPLOAD */}
        {passo === 'upload' && (
          <div className="space-y-6 py-4 flex-1 overflow-y-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-card border border-border">
              <div>
                <h4 className="font-medium text-foreground">Modelo de Planilha</h4>
                <p className="text-sm text-muted-foreground">
                  Baixe a planilha de exemplo já com os setores oficiais da edição para orientar o
                  preenchimento.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadModelo}
                disabled={baixandoModelo}
                className="shrink-0 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {baixandoModelo ? 'Gerando...' : 'Baixar Modelo XLSX'}
              </Button>
            </div>

            {/* Área de Seleção de Arquivo */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-accent/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 text-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleArquivoChange}
              />
              <UploadCloud className="w-12 h-12 text-accent mb-3" />
              <h3 className="font-semibold text-lg text-foreground">
                {arquivo ? arquivo.name : 'Clique para selecionar a planilha de candidatos'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Suporta formatos .xlsx e .xls (Tamanho máximo: 10MB)
              </p>
              {arquivo && (
                <Badge variant="info" className="mt-3">
                  {(arquivo.size / 1024).toFixed(1)} KB selecionado
                </Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-3 rounded border border-border/50">
              <p className="font-medium text-foreground">Colunas reconhecidas automaticamente:</p>
              <p>
                • <strong>Nome Completo</strong> (obrigatório)
              </p>
              <p>
                • <strong>Setor/Lotacao</strong> (obrigatório — deve coincidir com um setor
                cadastrado)
              </p>
              <p>
                • <strong>Cargo</strong> (opcional)
              </p>
              <p>
                • <strong>CPF</strong> (opcional — vincula ao eleitor do setor automaticamente)
              </p>
              <p>
                • <strong>Ordem de Exibição</strong> (opcional)
              </p>
            </div>
          </div>
        )}

        {/* PASSO 2: PREVIEW / CONFERÊNCIA */}
        {passo === 'preview' && preview && (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-border bg-card text-center">
                <span className="text-xs text-muted-foreground block">Total Lidas</span>
                <span className="text-xl font-bold text-foreground">{preview.totalLinhas}</span>
              </div>
              <div className="p-3 rounded-lg border border-success/30 bg-success/5 text-center">
                <span className="text-xs text-success block font-medium">Válidos</span>
                <span className="text-xl font-bold text-success">{preview.totalValidos}</span>
              </div>
              <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 text-center">
                <span className="text-xs text-warning block font-medium">Com Avisos</span>
                <span className="text-xl font-bold text-warning">{preview.totalAvisos}</span>
              </div>
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-center">
                <span className="text-xs text-destructive block font-medium">Com Erros</span>
                <span className="text-xl font-bold text-destructive">{preview.totalErros}</span>
              </div>
            </div>

            {/* Alerta de Setores não encontrados */}
            {preview.setoresNaoEncontrados.length > 0 && (
              <Alert variant="warning" className="text-xs">
                <AlertTriangle className="w-4 h-4 inline mr-1 text-warning" />
                <strong>
                  {preview.setoresNaoEncontrados.length} setor(es) da planilha não foram encontrados
                  na edição:
                </strong>
                <ul className="list-disc list-inside mt-1 max-h-24 overflow-y-auto font-mono">
                  {preview.setoresNaoEncontrados.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
                <p className="mt-1 text-muted-foreground">
                  Os candidatos desses setores foram marcados com erro e não serão importados.
                </p>
              </Alert>
            )}

            {/* Tabela de Preview */}
            <div className="border border-border rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/80 text-muted-foreground font-semibold sticky top-0 border-b border-border">
                  <tr>
                    <th className="p-2 w-12 text-center">Linha</th>
                    <th className="p-2">Nome do Candidato</th>
                    <th className="p-2">Cargo</th>
                    <th className="p-2">Setor Identificado</th>
                    <th className="p-2 w-24 text-center">Status</th>
                    <th className="p-2">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.itens.map((item, idx) => (
                    <tr key={idx} className={item.status === 'erro' ? 'bg-destructive/5' : ''}>
                      <td className="p-2 text-center text-muted-foreground">
                        {item.linhaOriginal}
                      </td>
                      <td className="p-2 font-medium text-foreground">{item.nome || '-'}</td>
                      <td className="p-2 text-muted-foreground">{item.cargo || '-'}</td>
                      <td className="p-2">
                        {item.setorNome ? (
                          <span className="text-foreground font-medium">{item.setorNome}</span>
                        ) : (
                          <span className="text-destructive">
                            {item.setorDigitado || '(vazio)'}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {item.status === 'valido' && (
                          <Badge variant="success">
                            <CheckCircle2 className="w-3 h-3" /> Válido
                          </Badge>
                        )}
                        {item.status === 'aviso' && (
                          <Badge variant="warning">
                            <AlertTriangle className="w-3 h-3" /> Aviso
                          </Badge>
                        )}
                        {item.status === 'erro' && (
                          <Badge variant="error">
                            <XCircle className="w-3 h-3" /> Erro
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground space-y-0.5">
                        {item.erros.map((e, eIdx) => (
                          <div key={eIdx} className="text-destructive flex items-center gap-1">
                            • {e}
                          </div>
                        ))}
                        {item.avisos.map((a, aIdx) => (
                          <div key={aIdx} className="text-warning flex items-center gap-1">
                            • {a}
                          </div>
                        ))}
                        {item.status === 'valido' && (
                          <span className="text-muted-foreground/70">Pronto para importação</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Opção de Substituição */}
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border text-sm">
              <input
                type="checkbox"
                id="substituirExistentes"
                checked={substituirExistentes}
                onChange={e => setSubstituirExistentes(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              <label
                htmlFor="substituirExistentes"
                className="cursor-pointer text-foreground font-medium"
              >
                Substituir todos os candidatos existentes desta edição antes de importar
              </label>
            </div>
          </div>
        )}

        {/* PASSO 3: SUCESSO */}
        {passo === 'sucesso' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Importação Concluída!</h3>
            <p className="text-muted-foreground max-w-md">
              Foram cadastrados com sucesso{' '}
              <strong className="text-foreground">{totalImportados}</strong> candidatos vinculados
              aos seus respectivos setores.
            </p>
          </div>
        )}

        <DialogFooter className="mt-4 flex flex-row items-center justify-between border-t border-border pt-4">
          {passo === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleAnalisarArquivo}
                disabled={!arquivo || carregandoPreview}
                className="flex items-center gap-2"
              >
                {carregandoPreview && <RefreshCw className="w-4 h-4 animate-spin" />}
                {carregandoPreview ? 'Analisando...' : 'Analisar Planilha'}
              </Button>
            </>
          )}

          {passo === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={() => setPasso('upload')}
                disabled={carregandoImportacao}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <Button
                onClick={handleConfirmarImportacao}
                disabled={carregandoImportacao || (preview?.totalValidos ?? 0) === 0}
                className="flex items-center gap-2"
              >
                {carregandoImportacao && <RefreshCw className="w-4 h-4 animate-spin" />}
                {carregandoImportacao
                  ? 'Importando...'
                  : `Confirmar Importação (${preview?.totalValidos ?? 0})`}
              </Button>
            </>
          )}

          {passo === 'sucesso' && (
            <Button onClick={handleClose} className="ml-auto">
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
