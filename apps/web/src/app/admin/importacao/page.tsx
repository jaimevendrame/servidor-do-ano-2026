'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, type ApiError } from '@/lib/api';
import { getAdminToken } from '@/lib/session';
import { uploadArquivo } from '@/lib/upload';
import { useEdicao } from '@/lib/edicao-context';
import type {
  LinhaXlsRaw,
  ResultadoValidacao,
  SetorDistinto,
  RegraNormalizacao,
  PreviewNormalizacao,
  ResultadoGravacao,
} from '@/lib/types';

type Etapa = 'upload' | 'validacao' | 'normalizacao' | 'confirmacao' | 'concluido';

export default function ImportacaoPage() {
  const router = useRouter();
  const { edicaoId } = useEdicao();
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [linhasRaw, setLinhasRaw] = useState<LinhaXlsRaw[]>([]);
  const [validacao, setValidacao] = useState<ResultadoValidacao | null>(null);
  const [setores, setSetores] = useState<SetorDistinto[]>([]);
  const [regra, setRegra] = useState<RegraNormalizacao>({
    dePara: {},
    guardaChuva: [],
    limiteMinimo: 3,
    nomeGuardaChuva: 'Setor Guarda-Chuva',
  });
  const [preview, setPreview] = useState<PreviewNormalizacao | null>(null);
  const [resultado, setResultado] = useState<ResultadoGravacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace('/admin/login');
    }
  }, [router]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo) {
      setErro('Selecione um arquivo XLS ou XLSX.');
      return;
    }
    setErro(null);
    setLoading(true);
    try {
      const resp = await uploadArquivo(arquivo);
      setLinhasRaw(resp.linhas);
      setEtapa('validacao');
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidar = async () => {
    setErro(null);
    setLoading(true);
    try {
      const resp = await api.post<ResultadoValidacao>('/importacao/validar', {
        linhas: linhasRaw,
      });
      setValidacao(resp.data);
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProximaEtapa = async () => {
    if (etapa === 'validacao') {
      setErro(null);
      setLoading(true);
      try {
        const resp = await api.post<SetorDistinto[]>('/importacao/setores', {
          linhas: validacao?.validas || [],
        });
        setSetores(resp.data);
        setEtapa('normalizacao');
      } catch (err) {
        const apiErr = err as ApiError;
        setErro(apiErr.message);
      } finally {
        setLoading(false);
      }
    } else if (etapa === 'normalizacao') {
      setErro(null);
      setLoading(true);
      try {
        const resp = await api.post<PreviewNormalizacao>('/importacao/preview', {
          linhas: validacao?.validas || [],
          regra,
        });
        setPreview(resp.data);
        setEtapa('confirmacao');
      } catch (err) {
        const apiErr = err as ApiError;
        setErro(apiErr.message);
      } finally {
        setLoading(false);
      }
    } else if (etapa === 'confirmacao') {
      if (!confirmado) {
        setErro('Marque a confirmacao para prosseguir.');
        return;
      }
      setErro(null);
      setLoading(true);
      try {
        const resp = await api.post<ResultadoGravacao>('/importacao/gravar', {
          edicaoId: edicaoId || 1,
          linhas: validacao?.validas || [],
          setores: preview?.setores || [],
          ator: 'admin',
        });
        setResultado(resp.data);
        setEtapa('concluido');
      } catch (err) {
        const apiErr = err as ApiError;
        setErro(apiErr.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVoltar = () => {
    setErro(null);
    if (etapa === 'validacao') setEtapa('upload');
    else if (etapa === 'normalizacao') setEtapa('validacao');
    else if (etapa === 'confirmacao') setEtapa('normalizacao');
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-primary">Importacao de XLS</h1>
        <p className="text-sm text-muted-foreground">
          Etapa atual: <strong>{etapa}</strong>
        </p>
      </div>

      {erro && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      {etapa === 'upload' && (
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Modelo de planilha</p>
                <p className="text-xs text-muted-foreground">
                  Baixe o arquivo modelo, preencha com os servidores e faca o upload.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href="/modelo-importacao-servidores.xlsx" download>
                    Modelo vazio (.xlsx)
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href="/modelo-teste-grande.xlsx" download>
                    Exemplo com dados (39)
                  </a>
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">Colunas obrigatorias:</p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>
                  <strong>Nome</strong> (ou Nome Completo / Servidor)
                </li>
                <li>
                  <strong>CPF</strong> — com ou sem mascara, digito verificador valido
                </li>
                <li>
                  <strong>Data de Admissao</strong> — formato AAAA-MM-DD (ex: 2010-02-01)
                </li>
                <li>
                  <strong>Setor/Lotacao</strong> (ou Setor / Unidade)
                </li>
              </ul>
              <p className="mb-1 mt-2 font-medium text-foreground">Colunas opcionais:</p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>Data de Nascimento</li>
                <li>Cargo (ou Funcao)</li>
              </ul>
              <p className="mt-2">
                Os dados devem estar na primeira aba. CPFs repetidos mantem a admissao mais antiga.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="arquivo">Arquivo XLS ou XLSX</Label>
            <Input
              id="arquivo"
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={e => setArquivo(e.target.files?.[0] || null)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Tamanho maximo: 10MB</p>
          </div>
          <Button type="submit" disabled={loading || !arquivo} className="w-full">
            {loading ? 'Enviando...' : 'Enviar arquivo'}
          </Button>
        </form>
      )}

      {etapa === 'validacao' && !validacao && (
        <div className="space-y-4">
          <p className="text-sm">
            Arquivo recebido com <strong>{linhasRaw.length}</strong> linhas. Clique abaixo para
            validar.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleValidar} disabled={loading} className="flex-1">
              {loading ? 'Validando...' : 'Validar linhas'}
            </Button>
            <Button onClick={handleVoltar} variant="outline" disabled={loading}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {etapa === 'validacao' && validacao && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{validacao.validas.length}</p>
              <p className="text-xs text-green-600">Validas</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{validacao.erros.length}</p>
              <p className="text-xs text-red-600">Erros</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{validacao.duplicados.length}</p>
              <p className="text-xs text-amber-600">Duplicados</p>
            </div>
          </div>

          {validacao.erros.length > 0 && (
            <details className="rounded-lg border border-border bg-card p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Ver erros ({validacao.erros.length})
              </summary>
              <div className="mt-2 max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">Linha</th>
                      <th className="text-left p-1">Campo</th>
                      <th className="text-left p-1">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validacao.erros.slice(0, 50).map((err, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-1">{err.linha}</td>
                        <td className="p-1">{err.campo}</td>
                        <td className="p-1">{err.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleProximaEtapa}
              disabled={loading || validacao.validas.length === 0}
              className="flex-1"
            >
              {loading ? 'Carregando setores...' : 'Continuar para normalizacao'}
            </Button>
            <Button onClick={handleVoltar} variant="outline" disabled={loading}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {etapa === 'normalizacao' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Foram encontrados <strong>{setores.length}</strong> setores distintos na planilha.
            Defina como eles serao organizados antes de gravar:
          </p>

          <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50/50 p-4 text-xs text-blue-700">
            <p className="mb-1 font-medium">Como funciona:</p>
            <ul className="ml-4 list-disc space-y-0.5">
              <li>
                Setores com <strong>menos servidores que o limite minimo</strong> sao agrupados
                automaticamente no setor guarda-chuva (setores pequenos demais para ter votacao
                propria).
              </li>
              <li>
                Use o <strong>de-para</strong> abaixo para unificar grafias diferentes do mesmo
                setor (ex: &quot;TI&quot; e &quot;Tecnologia da Informacao&quot; viram um so).
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="limiteMinimo">Limite minimo de servidores por setor</Label>
              <Input
                id="limiteMinimo"
                type="number"
                min={1}
                value={regra.limiteMinimo}
                onChange={e => setRegra({ ...regra, limiteMinimo: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">
                Setores com menos que isso vao para o guarda-chuva. Use <strong>1</strong> para
                manter todos os setores separados.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeGuardaChuva">Nome do setor guarda-chuva</Label>
              <Input
                id="nomeGuardaChuva"
                type="text"
                value={regra.nomeGuardaChuva}
                onChange={e => setRegra({ ...regra, nomeGuardaChuva: e.target.value })}
              />
            </div>
          </div>

          <details className="rounded-lg border border-border bg-card p-4" open>
            <summary className="cursor-pointer text-sm font-medium">
              Agrupar setores manualmente (de-para)
            </summary>
            <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
              {setores.map(s => (
                <div key={s.nomeOriginal} className="flex items-center gap-2 text-xs">
                  <span className="w-48 shrink-0 truncate font-medium" title={s.nomeOriginal}>
                    {s.nomeOriginal}
                  </span>
                  <span className="shrink-0 text-muted-foreground">({s.totalServidores})</span>
                  <Input
                    type="text"
                    placeholder="Agrupar como..."
                    className="h-8 text-xs"
                    value={regra.dePara[s.nomeOriginal] || ''}
                    onChange={e =>
                      setRegra({
                        ...regra,
                        dePara: {
                          ...regra.dePara,
                          [s.nomeOriginal]: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </details>

          <div className="flex gap-3">
            <Button onClick={handleProximaEtapa} disabled={loading} className="flex-1">
              {loading ? 'Gerando preview...' : 'Gerar preview'}
            </Button>
            <Button onClick={handleVoltar} variant="outline" disabled={loading}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {etapa === 'confirmacao' && preview && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Total de eleitores:</p>
            <p className="text-3xl font-bold">{preview.totalEleitores}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-sm font-semibold">
              Setores resultantes ({preview.setores.length}):
            </p>
            <div className="max-h-64 overflow-y-auto space-y-1 text-xs">
              {preview.setores.map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b py-1">
                  <span className={s.agrupado ? 'font-semibold text-amber-700' : ''}>
                    {s.nomeExibido}
                    {s.agrupado && ' (guarda-chuva)'}
                  </span>
                  <span className="text-muted-foreground">
                    {s.totalServidores} servidor{s.totalServidores !== 1 ? 'es' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200/50 bg-amber-50/50 p-4">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={e => setConfirmado(e.target.checked)}
                className="mt-1"
              />
              <span>
                Confirmo que revisei o preview acima e autorizo a gravacao definitiva no banco de
                dados. Esta acao nao pode ser desfeita.
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleProximaEtapa}
              disabled={loading || !confirmado}
              className="flex-1"
            >
              {loading ? 'Gravando...' : 'Gravar importacao'}
            </Button>
            <Button onClick={handleVoltar} variant="outline" disabled={loading}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {etapa === 'concluido' && resultado && (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200/50 bg-green-50/50 p-6 text-center">
            <div className="mb-3 text-4xl">✓</div>
            <h2 className="text-xl font-semibold text-green-700">Importacao concluida!</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{resultado.totalProcessados}</p>
              <p className="text-xs text-muted-foreground">Processados</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{resultado.setoresCriados}</p>
              <p className="text-xs text-muted-foreground">Setores criados</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{resultado.eleitoresNovos}</p>
              <p className="text-xs text-muted-foreground">Eleitores novos</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{resultado.eleitoresAtualizados}</p>
              <p className="text-xs text-muted-foreground">Eleitores atualizados</p>
            </div>
          </div>

          <Button onClick={() => router.push('/admin')} className="w-full">
            Voltar ao painel
          </Button>
        </div>
      )}
    </div>
  );
}
