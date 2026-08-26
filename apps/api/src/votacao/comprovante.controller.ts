/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ComprovanteService } from './comprovante.service';

@Controller('comprovante')
export class ComprovanteController {
  constructor(private readonly comprovanteService: ComprovanteService) {}

  @Get(':eleitorId')
  async download(@Param('eleitorId') eleitorId: string, @Res() res: Response): Promise<void> {
    const id = parseInt(eleitorId);
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