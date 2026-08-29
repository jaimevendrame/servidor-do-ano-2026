/* eslint-disable prettier/prettier */
import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuditoriaService } from './auditoria.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('admin/auditoria')
@UseGuards(AdminAuthGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  async listar(
    @Query('ator') ator?: string,
    @Query('acao') acao?: string,
    @Query('de') de?: string,
    @Query('ate') ate?: string
  ) {
    return this.auditoriaService.listar({
      ator,
      acao,
      de: de ? new Date(de) : undefined,
      ate: ate ? new Date(ate) : undefined,
    });
  }

  @Get('csv')
  async exportarCsv(
    @Query('ator') ator: string | undefined,
    @Query('acao') acao: string | undefined,
    @Query('de') de: string | undefined,
    @Query('ate') ate: string | undefined,
    @Res() res: Response
  ): Promise<void> {
    const csv = await this.auditoriaService.exportarCsv({
      ator,
      acao,
      de: de ? new Date(de) : undefined,
      ate: ate ? new Date(ate) : undefined,
    });

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=auditoria.csv',
    });
    res.send(csv);
  }
}
