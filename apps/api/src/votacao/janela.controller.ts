/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JanelaService, CriarJanelaDto, AtualizarDatasDto } from './janela.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('janela')
export class JanelaController {
  constructor(private readonly janelaService: JanelaService) {}

  @Post()
  async criar(@Body() dto: CriarJanelaDto) {
    try {
      return await this.janelaService.criar(dto);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro');
    }
  }

  @Get(':edicaoId')
  async status(@Param('edicaoId') edicaoId: string) {
    const id = parseInt(edicaoId);
    if (isNaN(id)) throw new BadRequestException('edicaoId invalido');
    return this.janelaService.status(id);
  }

  @Put(':edicaoId/abrir')
  async abrir(@Param('edicaoId') edicaoId: string, @Body() body: { ator: string }) {
    const id = parseInt(edicaoId);
    if (isNaN(id)) throw new BadRequestException('edicaoId invalido');
    try {
      await this.janelaService.abrirManual(id, body.ator);
      return { ok: true };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro');
    }
  }

  @Put(':edicaoId/fechar')
  async fechar(@Param('edicaoId') edicaoId: string, @Body() body: { ator: string }) {
    const id = parseInt(edicaoId);
    if (isNaN(id)) throw new BadRequestException('edicaoId invalido');
    try {
      await this.janelaService.fecharManual(id, body.ator);
      return { ok: true };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro');
    }
  }

  /**
   * PUT /api/admin/edicoes/:edicaoId/janela/datas
   * Atualiza as datas de início/fim da janela de votação.
   * Protegido por AdminAuthGuard (requer JWT admin válido).
   * Body: { dataInicio, dataFim, timezone? }
   */
  @Put(':edicaoId/datas')
  @UseGuards(AdminAuthGuard)
  async atualizarDatas(
    @Param('edicaoId') edicaoId: string,
    @Body() dto: AtualizarDatasDto,
    @Req() req: Request
  ) {
    const id = parseInt(edicaoId);
    if (isNaN(id)) throw new BadRequestException('edicaoId inválido');

    const ator = (req as Request & { adminUsername?: string }).adminUsername || 'admin';

    try {
      return await this.janelaService.atualizarDatas(id, dto, ator);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao atualizar datas'
      );
    }
  }
}
