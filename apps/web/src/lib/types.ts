/**
 * Tipos espelhando os DTOs da API.
 * Manter sincronizado com os DTOs em apps/api/src.
 * Estender sob demanda conforme as issues do M9 consomem novos endpoints.
 */

export interface Setor {
  id: number;
  /** Nome canonico (chave do de-para). */
  nome: string;
  /** Nome exibido ao eleitor. */
  nomeExibido: string;
}

export interface Eleitor {
  id: number;
  nome: string;
  cpf: string;
  setor: string; // nomeExibido do setor
}

export interface LoginEleitorDto {
  cpf: string;
  dataAdmissao: string; // YYYY-MM-DD
}

export interface LoginResponseDto {
  token: string;
  eleitor: Eleitor;
}

export type StatusJanela = 'agendada' | 'aberta' | 'fechada' | 'apurada';

export interface JanelaStatus {
  edicaoId: number;
  status: StatusJanela;
  abreEm?: string; // ISO
  fechaEm?: string; // ISO
}

export interface Candidato {
  id: number;
  nome: string;
  setorId: number;
  setorNome: string;
}

export interface Cedula {
  eleitorId: number;
  setor: string;
  candidatos: Candidato[];
  janela: JanelaStatus;
}
