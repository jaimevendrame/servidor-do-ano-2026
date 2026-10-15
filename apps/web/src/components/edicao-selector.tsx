'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api, type ApiError } from '@/lib/api';
import { useEdicao } from '@/lib/edicao-context';

/**
 * Seletor de eleição para o admin.
 * Renderiza apenas em rotas /admin/*.
 * Exibe dropdown com eleições e botão para criar nova.
 */
export function EdicaoSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const { edicaoId, edicoes, setEdicaoId, carregarEdicoes } = useEdicao();
  const [abrirModal, setAbrirModal] = useState(false);
  const [novoAno, setNovoAno] = useState('');
  const [nomePrefeitura, setNomePrefeitura] = useState('');
  const [cidade, setCidade] = useState('');
  const [descricao, setDescricao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Renderiza apenas se estamos em /admin/*
  if (!pathname?.startsWith('/admin')) {
    return null;
  }

  const handleMudarEdicao = (id: number) => {
    setEdicaoId(id);
    router.refresh(); // Recarrega a página com a nova eleição
  };

  const handleCriarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    const ano = parseInt(novoAno);
    if (isNaN(ano) || ano < 2020 || ano > 2100) {
      setErro('Ano deve ser entre 2020 e 2100');
      return;
    }
    if (!nomePrefeitura.trim()) {
      setErro('Nome da prefeitura é obrigatório');
      return;
    }

    setCarregando(true);
    setErro(null);
    try {
      await api.post('/edicoes', {
        ano,
        nomePrefeitura: nomePrefeitura.trim(),
        cidade: cidade.trim() || undefined,
        descricao: descricao.trim() || undefined,
      });
      await carregarEdicoes(); // Recarrega a lista
      setNovoAno('');
      setNomePrefeitura('');
      setCidade('');
      setDescricao('');
      setAbrirModal(false);
      // Não muda automaticamente pra nova — deixa o user escolher
    } catch (err) {
      const apiErr = err as ApiError;
      setErro(apiErr.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={edicaoId || ''}
        onChange={e => handleMudarEdicao(parseInt(e.target.value))}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
      >
        {edicoes.length === 0 ? (
          <option disabled>Carregando...</option>
        ) : (
          edicoes.map(e => (
            <option key={e.id} value={e.id}>
              Eleição {e.ano}
            </option>
          ))
        )}
      </select>

      <Dialog open={abrirModal} onOpenChange={setAbrirModal}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            + Nova
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova eleição</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCriarEdicao} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ano-input">Ano</Label>
              <Input
                id="ano-input"
                type="number"
                min={2020}
                max={2100}
                value={novoAno}
                onChange={e => setNovoAno(e.target.value)}
                placeholder="ex: 2027"
                disabled={carregando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefeitura-input">Nome da prefeitura</Label>
              <Input
                id="prefeitura-input"
                type="text"
                value={nomePrefeitura}
                onChange={e => setNomePrefeitura(e.target.value)}
                placeholder="ex: Prefeitura de Campo Mourão"
                disabled={carregando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade-input">Cidade (opcional)</Label>
              <Input
                id="cidade-input"
                type="text"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="ex: Campo Mourão"
                disabled={carregando}
              />
              <p className="text-xs text-muted-foreground">
                Usada para gerar o endereço da votação (slug).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao-input">Descrição (opcional)</Label>
              <Input
                id="descricao-input"
                type="text"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="ex: Votação anual dos servidores"
                disabled={carregando}
              />
            </div>

            {erro && (
              <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                {erro}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={carregando || !novoAno || !nomePrefeitura}
                className="flex-1"
              >
                {carregando ? 'Criando...' : 'Criar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAbrirModal(false)}
                disabled={carregando}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
