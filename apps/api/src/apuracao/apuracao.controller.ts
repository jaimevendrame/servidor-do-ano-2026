/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ApuracaoService, ResultadoApuracao } from './apuracao.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('admin/apuracao')
@UseGuards(AdminAuthGuard)
export class ApuracaoController {
  constructor(private readonly apuracaoService: ApuracaoService) {}

  @Get(':edicaoId/excel')
  async exportarExcel(
    @Param('edicaoId') edicaoId: string,
    @Res() res: Response,
  ): Promise<void> {
    const id = parseInt(edicaoId, 10);
    if (isNaN(id)) throw new BadRequestException('edicaoId invalido');

    try {
      const buffer = await this.apuracaoService.exportarExcel(id);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=apuracao-edicao-${id}.xlsx`,
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro ao exportar apuracao');
    }
  }

  @Get(':edicaoId')
  async apurar(@Param('edicaoId') edicaoId: string): Promise<ResultadoApuracao> {
    const id = parseInt(edicaoId);
    if (isNaN(id)) throw new BadRequestException('edicaoId invalido');
    try {
      return await this.apuracaoService.apurar(id);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro');
    }
  }
}

