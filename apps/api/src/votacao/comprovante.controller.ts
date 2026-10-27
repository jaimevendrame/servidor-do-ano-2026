/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ComprovanteService } from './comprovante.service';
import { EleitorAuthGuard } from '../auth/eleitor-auth.guard';

@Controller('comprovante')
export class ComprovanteController {
  constructor(private readonly comprovanteService: ComprovanteService) {}

  /**
   * GET /api/comprovante/:eleitorId
   *
   * Exige JWT de elector: payload.sub DEVE ser igual a :eleitorId.
   * O PDF contem nome, setor e horario do voto — dados pessoais.
   * Ver issue #105.
   */
  @Get(':eleitorId')
  @UseGuards(EleitorAuthGuard)
  async download(@Param('eleitorId') eleitorId: string, @Res() res: Response): Promise<void> {
    const id = parseInt(eleitorId, 10);
    if (isNaN(id)) throw new BadRequestException('eleitorId invalido');

    try {
      const pdf = await this.comprovanteService.gerar(id);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=comprovante-servidor-do-ano.pdf`,
        'Content-Length': pdf.length,
      });
      res.end(pdf);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro');
    }
  }
}
