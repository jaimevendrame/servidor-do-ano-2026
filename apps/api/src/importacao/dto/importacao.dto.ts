/* eslint-disable prettier/prettier */
import { LinhaXlsRaw } from './linha-xls.dto';
import { LinhaValidada } from '../validar-linhas';
import { RegraNormalizacao, SetorNormalizado } from '../normalizar-setores';

export class ValidarLinhasDto {
  linhas!: LinhaXlsRaw[];
}

export class SetoresDto {
  linhas!: LinhaValidada[];
}

export class PreviewNormalizacaoDto {
  linhas!: LinhaValidada[];
  regra!: RegraNormalizacao;
}

export class GravarDto {
  edicaoId!: number;
  linhas!: LinhaValidada[];
  setores!: SetorNormalizado[];
  ator!: string;
}
