/**
 * Helper para upload de arquivo via FormData.
 */

import { api } from './api';

/**
 * Faz upload de arquivo XLS para /importacao/upload (multipart).
 * Content-Type multipart/form-data eh definido automaticamente pelo browser.
 */
export async function uploadArquivo(arquivo: File): Promise<{
  totalLinhas: number;
  linhas: import('./types').LinhaXlsRaw[];
}> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);

  const response = await api.post('/importacao/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}
