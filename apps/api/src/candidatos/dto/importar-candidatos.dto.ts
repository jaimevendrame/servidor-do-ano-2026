export interface LinhaCandidatoRaw {
  linhaOriginal: number;
  nome?: string;
  setor?: string;
  cargo?: string;
  cpf?: string;
  ordemExibicao?: number;
}

export interface CandidatoPreviewItem {
  linhaOriginal: number;
  nome: string;
  cargo?: string;
  cpf?: string;
  setorDigitado: string;
  setorId?: number;
  setorNome?: string;
  eleitorId?: number;
  ordemExibicao: number;
  status: 'valido' | 'aviso' | 'erro';
  erros: string[];
  avisos: string[];
}

export interface ResultadoPreviewCandidatos {
  totalLinhas: number;
  totalValidos: number;
  totalErros: number;
  totalAvisos: number;
  setoresNaoEncontrados: string[];
  itens: CandidatoPreviewItem[];
}

export class ConfirmarImportacaoCandidatosDto {
  edicaoId!: number;
  substituirExistentes?: boolean;
  candidatos!: Array<{
    nome: string;
    cargo?: string;
    setorId: number;
    eleitorId?: number;
    ordemExibicao?: number;
  }>;
}
