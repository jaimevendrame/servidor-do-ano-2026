import { Injectable } from '@nestjs/common';
import { parsearXls } from './parsear-xls';
import { ResultadoParsing } from './dto/linha-xls.dto';

@Injectable()
export class ImportacaoService {
  /**
   * Recebe buffer do arquivo XLS/XLSX e retorna as linhas parsed.
   * NÃ£o valida conteÃºdo â€” apenas estrutura e mapeamento de colunas.
   */
  parsear(buffer: Buffer): ResultadoParsing {
    return parsearXls(buffer);
  }
}
