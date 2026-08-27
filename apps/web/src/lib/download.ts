/**
 * Helper para download de arquivo via blob (suporta JWT injetado pelo interceptor).
 */

import { api } from './api';

/**
 * Baixa o comprovante PDF do eleitor via GET /comprovante/:eleitorId.
 * Cria um Object URL e dispara download programatico.
 */
export async function downloadComprovante(eleitorId: number): Promise<void> {
  try {
    const response = await api.get(`/comprovante/${eleitorId}`, {
      responseType: 'blob',
    });

    const blob = response.data as Blob;
    const url = URL.createObjectURL(blob);

    // Cria <a> temporario e dispara click
    const link = document.createElement('a');
    link.href = url;
    link.download = 'comprovante-servidor-do-ano.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoga URL apos download
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Erro ao baixar comprovante');
  }
}
