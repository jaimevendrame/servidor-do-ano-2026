/* eslint-disable prettier/prettier */
export class CriarCandidatoDto {
  edicaoId!: number;
  setorId!: number;
  eleitorId?: number;
  nome!: string;
  cargo?: string;
  ordemExibicao?: number;
}

export class AtualizarCandidatoDto {
  nome?: string;
  cargo?: string;
  ordemExibicao?: number;
}
