import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportacaoService } from './importacao.service';
import { GravacaoService } from './gravacao.service';
import {
  ValidarLinhasDto,
  SetoresDto,
  PreviewNormalizacaoDto,
  GravarDto,
} from './dto/importacao.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('importacao')
@UseGuards(AdminAuthGuard)
export class ImportacaoController {
  constructor(
    private readonly importacaoService: ImportacaoService,
    private readonly gravacaoService: GravacaoService
  ) {}

  /**
   * POST /api/importacao/upload
   * Recebe arquivo XLS/XLSX e retorna linhas parsed + relatorio de colunas.
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
          cb(new BadRequestException('Formato invalido. Envie um arquivo .xls ou .xlsx'), false);
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
        `Colunas obrigatorias nao encontradas: ${resultado.colunasFaltando.join(', ')}`
      );
    }

    return {
      totalLinhas: resultado.totalLinhas,
      linhas: resultado.linhas,
    };
  }

  /**
   * POST /api/importacao/validar
   * Valida linhas parseadas. Retorna validas, erros e duplicados.
   */
  @Post('validar')
  validar(@Body() dto: ValidarLinhasDto) {
    return this.importacaoService.validar({
      linhas: dto.linhas,
      totalLinhas: dto.linhas.length,
      colunasFaltando: [],
    });
  }

  /**
   * POST /api/importacao/setores
   * Extrai setores distintos das linhas validadas.
   */
  @Post('setores')
  setores(@Body() dto: SetoresDto) {
    return this.importacaoService.extrairSetores(dto.linhas);
  }

  /**
   * POST /api/importacao/preview
   * Aplica regras de normalizacao e retorna preview (nao grava).
   */
  @Post('preview')
  preview(@Body() dto: PreviewNormalizacaoDto) {
    return this.importacaoService.previewNormalizacao(dto.linhas, dto.regra);
  }

  /**
   * POST /api/importacao/gravar
   * Grava as linhas validadas e normalizadas. Bloqueia se votacao aberta.
   */
  @Post('gravar')
  async gravar(@Body() dto: GravarDto) {
    try {
      return await this.gravacaoService.gravar(dto.edicaoId, dto.linhas, dto.setores, dto.ator);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro ao gravar');
    }
  }
}
