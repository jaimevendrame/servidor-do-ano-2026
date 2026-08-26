/**
 * DTO que representa uma linha parsed do XLS do RH.
 * Campos conforme PRD Â§7: Nome, CPF, Data de Nascimento, Data de AdmissÃ£o, Cargo, Setor/LotaÃ§Ã£o.
 */
export interface LinhaXlsRaw {
  nome: string | undefined;
  cpf: string | undefined;
  dataNascimento: string | undefined;
  dataAdmissao: string | undefined;
  cargo: string | undefined;
  setor: string | undefined;
  linhaOriginal: number; // 1-indexed (linha no arquivo)
}

export interface ResultadoParsing {
  linhas: LinhaXlsRaw[];
  totalLinhas: number;
  colunasFaltando: string[];
}
