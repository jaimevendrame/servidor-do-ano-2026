'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from './api';
import type { Edicao } from './types';

const STORAGE_KEY = 'sda:edicao-atual';

interface EdicaoContextType {
  edicaoId: number | null;
  edicoes: Edicao[];
  loading: boolean;
  setEdicaoId: (id: number) => void;
  carregarEdicoes: () => Promise<void>;
}

const EdicaoContext = createContext<EdicaoContextType>({
  edicaoId: null,
  edicoes: [],
  loading: true,
  setEdicaoId: () => {},
  carregarEdicoes: async () => {},
});

/**
 * Provider que gerencia a eleição (edição) atualmente selecionada.
 * Carrega a lista de eleições da API e persiste a seleção em localStorage.
 */
export function EdicaoProvider({ children }: { children: ReactNode }) {
  const [edicaoId, setEdicaoIdState] = useState<number | null>(null);
  const [edicoes, setEdicoes] = useState<Edicao[]>([]);
  const [loading, setLoading] = useState(true);

  const setEdicaoId = useCallback((id: number) => {
    setEdicaoIdState(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(id));
    }
  }, []);

  const carregarEdicoes = useCallback(async () => {
    try {
      const resp = await api.get<Edicao[]>('/edicoes');
      setEdicoes(resp.data);

      // Se nao tem edicao selecionada, seleciona a mais recente (primeira — ordenada desc)
      if (resp.data.length > 0) {
        const salvo =
          typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
        const salvoId = salvo ? parseInt(salvo) : null;

        // Valida que a edição salva existe na lista
        const existe = salvoId && resp.data.some(e => e.id === salvoId);
        if (existe) {
          setEdicaoIdState(salvoId);
        } else {
          // Seleciona a mais recente
          setEdicaoId(resp.data[0].id);
        }
      }
    } catch {
      // Se falhar (API nao disponivel), mantém estado atual
    } finally {
      setLoading(false);
    }
  }, [setEdicaoId]);

  useEffect(() => {
    carregarEdicoes();
  }, [carregarEdicoes]);

  return (
    <EdicaoContext.Provider value={{ edicaoId, edicoes, loading, setEdicaoId, carregarEdicoes }}>
      {children}
    </EdicaoContext.Provider>
  );
}

/**
 * Hook para acessar a eleição selecionada e a lista de eleições.
 */
export function useEdicao(): EdicaoContextType {
  return useContext(EdicaoContext);
}
