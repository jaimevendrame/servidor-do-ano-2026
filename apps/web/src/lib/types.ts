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
  cargo?: string | null;
  ordem: number; // ordemExibicao
}

export interface Cedula {
  votavel: boolean;
  motivo?: 'SETOR_SEM_CANDIDATOS' | 'SETOR_COM_UM_CANDIDATO';
  candidatos: Candidato[];
}

export interface VotoResult {
  sucesso: boolean;
  jaVotou?: boolean;
  registradoEm?: Date | string;
}

export interface StatusParticipacao {
  jaVotou: boolean;
  registradoEm: string | null;
}

export interface LoginAdminDto {
  username: string;
  senha: string;
  totpCode?: string;
}

export interface LoginAdminResponse {
  token: string;
  totpRequired: boolean;
}

export interface TotpSetupResponse {
  secret: string;
  qrCode: string;
}

// === Importacao XLS ===

export interface LinhaXlsRaw {
  nome?: string;
  cpf?: string;
  dataNascimento?: string;
  dataAdmissao?: string;
  cargo?: string;
  setor?: string;
  linhaOriginal: number;
}

export interface LinhaValidada {
  nome: string;
  cpf: string;
  dataNascimento?: string;
  dataAdmissao: string;
  cargo?: string;
  setor: string;
  linhaOriginal: number;
}

export interface ErroLinha {
  linha: number;
  campo: string;
  motivo: string;
}

export interface ResultadoValidacao {
  validas: LinhaValidada[];
  erros: ErroLinha[];
  duplicados: { cpf: string; linhaRemovida: number; linhaPreservada: number }[];
}

export interface SetorDistinto {
  nomeOriginal: string;
  totalServidores: number;
}

export interface RegraNormalizacao {
  dePara: Record<string, string>;
  guardaChuva: string[];
  limiteMinimo: number;
  nomeGuardaChuva: string;
}

export interface SetorNormalizado {
  nomeOficial: string;
  nomeExibido: string;
  agrupado: boolean;
  totalServidores: number;
  origens: string[];
}

export interface PreviewNormalizacao {
  setores: SetorNormalizado[];
  totalEleitores: number;
}

export interface ResultadoGravacao {
  setoresCriados: number;
  eleitoresNovos: number;
  eleitoresAtualizados: number;
  totalProcessados: number;
}
