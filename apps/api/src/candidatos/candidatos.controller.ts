/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidatosService } from './candidatos.service';
import { CriarCandidatoDto, AtualizarCandidatoDto } from './dto/candidato.dto';
import { ConfirmarImportacaoCandidatosDto } from './dto/importar-candidatos.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('candidatos')
export class CandidatosController {
  constructor(private readonly candidatosService: CandidatosService) {}

  @Post()
  @UseGuards(AdminAuthGuard)
  async criar(@Body() dto: CriarCandidatoDto) {
    try {
      return await this.candidatosService.criar(dto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao criar candidato'
      );
    }
  }

  /**
   * GET /api/candidatos
   *
   * Exige AdminAuthGuard: a listagem completa expoe os candidatos de TODOS
   * os setores da edicao. O elector nunca usa esta rota — a cedula e escopada
   * ao setor via GET /api/cedula/:eleitorId.
   * Ver issue #105.
   */
  @Get()
  @UseGuards(AdminAuthGuard)
  async listar(@Query('edicaoId') edicaoId: string, @Query('setorId') setorId?: string) {
    const eid = parseInt(edicaoId, 10);
    if (isNaN(eid)) throw new BadRequestException('edicaoId obrigatorio');

    if (setorId) {
      return this.candidatosService.listarPorSetor(eid, parseInt(setorId, 10));
    }
    return this.candidatosService.listarPorEdicao(eid);
  }

  /**
   * GET /api/candidatos/modelo-planilha?edicaoId=1
   * Baixa arquivo XLSX modelo de candidatos
   */
  @Get('modelo-planilha')
  @UseGuards(AdminAuthGuard)
  async downloadModelo(@Query('edicaoId') edicaoId: string, @Res() res: Response) {
    const eid = edicaoId ? parseInt(edicaoId, 10) : undefined;
    const buffer = await this.candidatosService.gerarModeloXlsx(eid);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="modelo_candidatos.xlsx"');
    res.end(buffer);
  }

  /**
   * POST /api/candidatos/upload-preview?edicaoId=1
   * Recebe XLSX e retorna preview com validações de setor e integridade
   */
  @Post('upload-preview')
  @UseGuards(AdminAuthGuard)
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
  async uploadPreview(
    @UploadedFile() arquivo: Express.Multer.File,
    @Query('edicaoId') edicaoId: string
  ) {
    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    const eid = parseInt(edicaoId, 10);
    if (isNaN(eid)) {
      throw new BadRequestException('edicaoId é obrigatório.');
    }

    return this.candidatosService.previewImportacao(eid, arquivo.buffer);
  }

  /**
   * POST /api/candidatos/importar
   * Confirma a importação em lote de candidatos
   */
  @Post('importar')
  @UseGuards(AdminAuthGuard)
  async importar(@Body() dto: ConfirmarImportacaoCandidatosDto) {
    try {
      return await this.candidatosService.confirmarImportacao(dto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao importar candidatos.'
      );
    }
  }

  @Put(':id')
  @UseGuards(AdminAuthGuard)
  async atualizar(@Param('id') id: string, @Body() dto: AtualizarCandidatoDto) {
    try {
      return await this.candidatosService.atualizar(parseInt(id, 10), dto);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro ao atualizar');
    }
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  async remover(@Param('id') id: string) {
    try {
      return await this.candidatosService.remover(parseInt(id, 10));
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro ao remover');
    }
  }
}
