import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportacaoService } from './importacao.service';

@Controller('importacao')
export class ImportacaoController {
  constructor(private readonly importacaoService: ImportacaoService) {}

  /**
   * POST /api/importacao/upload
   * Recebe arquivo XLS/XLSX e retorna linhas parsed + relatÃ³rio de colunas.
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const extensoesPermitidas = [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (extensoesPermitidas.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Formato invÃ¡lido. Envie um arquivo .xls ou .xlsx'), false);
        }
      },
    })
  )
  upload(@UploadedFile() arquivo: Express.Multer.File) {
    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const resultado = this.importacaoService.parsear(arquivo.buffer);

    if (resultado.colunasFaltando.length > 0) {
      throw new BadRequestException(
        `Colunas obrigatÃ³rias nÃ£o encontradas: ${resultado.colunasFaltando.join(', ')}`
      );
    }

    return {
      totalLinhas: resultado.totalLinhas,
      linhas: resultado.linhas,
    };
  }
}
