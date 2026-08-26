import { Injectable } from '@nestjs/common';
import { parsearXls } from './parsear-xls';
import { ResultadoParsing } from './dto/linha-xls.dto';
import { validarLinhas, ResultadoValidacao } from './validar-linhas';

@Injectable()
export class ImportacaoService {
  parsear(buffer: Buffer): ResultadoParsing {
    return parsearXls(buffer);
  }

  validar(linhas: ResultadoParsing): ResultadoValidacao {
    return validarLinhas(linhas.linhas);
  }
}
