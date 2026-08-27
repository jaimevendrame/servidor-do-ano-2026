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
  clearVotoEscolhido();
  // Token ja eh limpo em api.ts interceptor, mas podemos chamar explicitamente
  clearToken();
}

const VOTO_ESCOLHIDO_KEY = 'sda:voto-escolhido';
const VOTO_REGISTRADO_KEY = 'sda:voto-registrado';

interface VotoEscolhido {
  id: number;
  nome: string;
}

/**
 * Salva o candidato escolhido na cedula (id + nome, antes da confirmacao).
 */
export function setVotoEscolhido(candidato: VotoEscolhido): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VOTO_ESCOLHIDO_KEY, JSON.stringify(candidato));
}

/**
 * Recupera o candidato escolhido, ou null.
 */
export function getVotoEscolhido(): VotoEscolhido | null {
  if (typeof window === 'undefined') return null;
  const json = window.localStorage.getItem(VOTO_ESCOLHIDO_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json) as VotoEscolhido;
  } catch {
    return null;
  }
}

/**
 * Remove o voto escolhido (apos gravar ou ao voltar).
 */
export function clearVotoEscolhido(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(VOTO_ESCOLHIDO_KEY);
}

/**
 * Salva o timestamp do voto registrado (sucesso em POST /voto).
 */
export function setVotoRegistrado(timestamp: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VOTO_REGISTRADO_KEY, timestamp);
}

/**
 * Recupera o timestamp do voto registrado.
 */
export function getVotoRegistrado(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(VOTO_REGISTRADO_KEY);
}

/**
 * Remove o voto registrado (apos visualizar comprovante).
 */
export function clearVotoRegistrado(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(VOTO_REGISTRADO_KEY);
}
