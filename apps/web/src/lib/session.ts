/**
 * Store de sessao para o eleitor logado.
 * Complementar ao token gerenciado em api.ts.
 * Dados salvos em localStorage, necessario no client.
 */

import type { Eleitor } from './types';
import { clearToken } from './api';

const ELEITOR_KEY = 'sda:eleitor';

/**
 * Salva os dados do eleitor apos login bem-sucedido.
 */
export function setEleitor(eleitor: Eleitor): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ELEITOR_KEY, JSON.stringify(eleitor));
}

/**
 * Recupera os dados do eleitor, ou null se nao existem.
 */
export function getEleitor(): Eleitor | null {
  if (typeof window === 'undefined') return null;
  const json = window.localStorage.getItem(ELEITOR_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json) as Eleitor;
  } catch {
    return null;
  }
}

/**
 * Limpa a sessao inteira: token + eleitor.
 * Chamado ao logout ou quando token expira (401).
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ELEITOR_KEY);
  // Token ja eh limpo em api.ts interceptor, mas podemos chamar explicitamente
  clearToken();
}
