/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EdicaoService, CriarEdicaoDto, EdicaoDto, EdicaoAtivaDto } from './edicao.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('edicoes')
export class EdicaoController {
  constructor(private readonly edicaoService: EdicaoService) {}

  /**
   * POST /api/edicoes
   * Cria uma nova eleição (edição). ADMIN.
   * Body: { ano, nomePrefeitura, cidade?, descricao? }
   */
  @Post()
  @UseGuards(AdminAuthGuard)
  async criar(@Body() dto: CriarEdicaoDto): Promise<EdicaoDto> {
    if (!dto.nomePrefeitura || dto.nomePrefeitura.trim().length === 0) {
      throw new BadRequestException('Nome da prefeitura é obrigatório');
    }
    try {
      return await this.edicaoService.criar(dto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao criar eleição'
      );
    }
  }

  /**
   * GET /api/edicoes
   * Lista todas as eleições ordenadas por ano (mais recentes primeiro).
   */
  @Get()
  async listar(): Promise<EdicaoDto[]> {
    try {
      return await this.edicaoService.listar();
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao listar eleições'
      );
    }
  }

  /**
   * GET /api/edicoes/ativas
   * Lista eleições ativas com vigência e status (para home pública).
   */
  @Get('ativas')
  async listarAtivas(): Promise<EdicaoAtivaDto[]> {
    try {
      return await this.edicaoService.listarAtivas();
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao listar eleições ativas'
      );
    }
  }

  /**
   * GET /api/edicoes/slug/:slug
   * Resolve um slug para os dados da eleição.
   */
  @Get('slug/:slug')
  async obterPorSlug(@Param('slug') slug: string): Promise<EdicaoDto> {
    try {
      return await this.edicaoService.obterPorSlug(slug);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Eleição não encontrada'
      );
    }
  }

  /**
   * GET /api/edicoes/:id
   * Obtém uma eleição específica.
   */
  @Get(':id')
  async obter(@Param('id') id: string): Promise<EdicaoDto> {
    const eid = parseInt(id);
    if (isNaN(eid)) throw new BadRequestException('ID invalido');

    try {
      return await this.edicaoService.obter(eid);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao obter eleição'
      );
    }
  }

  /**
   * PUT /api/edicoes/:id/ativar
   * Ativa uma eleição.
   */
  @Put(':id/ativar')
  @UseGuards(AdminAuthGuard)
  async ativar(@Param('id') id: string): Promise<EdicaoDto> {
    const eid = parseInt(id);
    if (isNaN(eid)) throw new BadRequestException('ID invalido');

    try {
      return await this.edicaoService.ativar(eid);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao ativar eleição'
      );
    }
  }

  /**
   * PUT /api/edicoes/:id/desativar
   * Desativa uma eleição.
   */
  @Put(':id/desativar')
  @UseGuards(AdminAuthGuard)
  async desativar(@Param('id') id: string): Promise<EdicaoDto> {
    const eid = parseInt(id);
    if (isNaN(eid)) throw new BadRequestException('ID invalido');

    try {
      return await this.edicaoService.desativar(eid);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao desativar eleição'
      );
    }
  }
}
