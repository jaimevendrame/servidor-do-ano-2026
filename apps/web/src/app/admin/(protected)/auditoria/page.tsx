'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { AdminSkeleton } from '@/components/admin/admin-skeleton';
import { api, type ApiError } from '@/lib/api';
import type { LogEntry } from '@/lib/types';

interface Filtros {
  ator: string;
  acao: string;
  de: string;
  ate: string;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const [ator, setAtor] = useState('');
  const [acao, setAcao] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');

  const construirParams = (f: Filtros): URLSearchParams => {
    const params = new URLSearchParams();
    if (f.ator) params.set('ator', f.ator);
    if (f.acao) params.set('acao', f.acao);
    if (f.de) params.set('de', f.de);
    if (f.ate) params.set('ate', f.ate);
    return params;
  };

  const carregar = useCallback(async (f: Filtros) => {
    setLoading(true);
    setErro(null);
    try {
      const params = construirParams(f);
      const resp = await api.get<LogEntry[]>(`/admin/auditoria?${params.toString()}`);
      setLogs(resp.data);
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar({ ator: '', acao: '', de: '', ate: '' });
  }, [carregar]);

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    carregar({ ator, acao, de, ate });
  };

  const handleExportarCsv = async () => {
    setExportando(true);
    try {
      const params = new URLSearchParams();
      if (ator) params.set('ator', ator);
      if (acao) params.set('acao', acao);
      if (de) params.set('de', de);
      if (ate) params.set('ate', ate);
      const resp = await api.get(`/admin/auditoria/csv?${params.toString()}`, {
        responseType: 'blob',
      });
      const blob = resp.data as Blob;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'auditoria.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6">
      {erro && <Alert variant="error">{erro}</Alert>}

      <form onSubmit={handleFiltrar} className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="space-y-1">
          <Label htmlFor="ator" className="text-xs">
            Ator
          </Label>
          <Input
            id="ator"
            placeholder="admin"
            value={ator}
            onChange={e => setAtor(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="acao" className="text-xs">
            Ação
          </Label>
          <Input
            id="acao"
            placeholder="login"
            value={acao}
            onChange={e => setAcao(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="de" className="text-xs">
            De
          </Label>
          <Input
            id="de"
            type="date"
            value={de}
            onChange={e => setDe(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ate" className="text-xs">
            Até
          </Label>
          <Input
            id="ate"
            type="date"
            value={ate}
            onChange={e => setAte(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm" className="h-8">
            Filtrar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={handleExportarCsv}
            disabled={exportando}
          >
            {exportando ? '...' : 'CSV'}
          </Button>
        </div>
      </form>

      {loading ? (
        <AdminSkeleton variant="table" />
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhum log encontrado.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b">
                  <th className="p-2 text-left">Timestamp</th>
                  <th className="p-2 text-left">Ator</th>
                  <th className="p-2 text-left">Ação</th>
                  <th className="p-2 text-left">Payload</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="whitespace-nowrap p-2 text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-2 font-medium">{log.ator}</td>
                    <td className="p-2">{log.acao}</td>
                    <td className="max-w-[200px] truncate p-2 text-muted-foreground">
                      {log.payload ? JSON.stringify(log.payload) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t p-2 text-center text-xs text-muted-foreground">
            {logs.length} registro{logs.length !== 1 ? 's' : ''} (max 1000)
          </div>
        </div>
      )}
    </div>
  );
}
