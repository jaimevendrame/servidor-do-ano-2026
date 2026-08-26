/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Put, Body, Param, BadRequestException } from '@nestjs/common';
import { JanelaService, CriarJanelaDto } from './janela.service';

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
}
