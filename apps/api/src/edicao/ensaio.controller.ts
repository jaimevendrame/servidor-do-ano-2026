/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { EnsaioService } from './ensaio.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

/**
 * Endpoints de limpeza de ENSAIO.
 *
 * Apagam apenas votos e participacoes de uma edicao, preservando a base de
 * cadastro (candidatos, eloquentes, setores) e a janela. Sao distintos do
 * expurgo de LGPD (/api/admin/retencao), que apaga tudo e so pode rodar
 * 90 dias apos o fechamento.
 */
@Controller('admin/edicoes')
@UseGuards(AdminAuthGuard)
export class EnsaioController {
  constructor(private readonly ensaioService: EnsaioService) {}

  /**
   * GET /api/admin/edicoes/:edicaoId/limpeza-ensaio
   * Mostra o que sera removido, sem alterar nada.
   */
  @Get(':edicaoId/limpeza-ensaio')
  async previa(@Param('edicaoId') edicaoId: string) {
    const id = parseInt(edicaoId, 10);
    if (isNaN(id)) throw new BadRequestException('edicaoId invalido');
    return this.ensaioService.previa(id);
  }

  /**
   * POST /api/admin/edicoes/:edicaoId/limpeza-ensaio
   * Executa a limpeza dos votos de ensaio.
   */
  @Post(':edicaoId/limpeza-ensaio')
  async limpar(@Param('edicaoId') edicaoId: string, @Req() req: Request) {
    const id = parseInt(edicaoId, 10);
    if (isNaN(id)) throw new BadRequestException('edicaoId invalido');

    const ator = (req as Request & { adminUsername?: string }).adminUsername || 'admin';

    try {
      return await this.ensaioService.limpar(id, ator);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao limpar ensaio'
      );
    }
  }
}
