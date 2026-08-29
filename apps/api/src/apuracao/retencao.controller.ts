/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { RetencaoService } from './retencao.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('admin/retencao')
@UseGuards(AdminAuthGuard)
export class RetencaoController {
  constructor(private readonly retencaoService: RetencaoService) {}

  @Get(':edicaoId')
  async verificar(@Param('edicaoId') edicaoId: string) {
    const id = parseInt(edicaoId);
    if (isNaN(id)) throw new BadRequestException('edicaoId invalido');
    return this.retencaoService.verificarElegibilidade(id);
  }

  @Post(':edicaoId/executar')
  async executar(@Param('edicaoId') edicaoId: string, @Body() body: { ator: string }) {
    const id = parseInt(edicaoId);
    if (isNaN(id)) throw new BadRequestException('edicaoId invalido');
    try {
      return await this.retencaoService.executar(id, body.ator);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro');
    }
  }
}
