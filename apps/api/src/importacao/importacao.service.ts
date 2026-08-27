/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { parsearXls } from './parsear-xls';
import { ResultadoParsing } from './dto/linha-xls.dto';
import { validarLinhas, ResultadoValidacao } from './validar-linhas';
import {
  extrairSetoresDistintos,
  aplicarNormalizacao,
  SetorDistinto,
  RegraNormalizacao,
  PreviewNormalizacao,
} from './normalizar-setores';
import { LinhaValidada } from './validar-linhas';

@Injectable()
export class ImportacaoService {
  parsear(buffer: Buffer): ResultadoParsing {
    return parsearXls(buffer);
  }

  validar(linhas: ResultadoParsing): ResultadoValidacao {
    return validarLinhas(linhas.linhas);
  }

  extrairSetores(linhasValidas: LinhaValidada[]): SetorDistinto[] {
    return extrairSetoresDistintos(linhasValidas);
  }

  previewNormalizacao(linhasValidas: LinhaValidada[], regra: RegraNormalizacao): PreviewNormalizacao {
    return aplicarNormalizacao(linhasValidas, regra);
  }
}
