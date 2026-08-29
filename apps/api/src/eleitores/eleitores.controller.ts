/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { EleitorService, BloqueioDto } from './eleitores.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('admin/eleitores')
@UseGuards(AdminAuthGuard)
export class EleitorController {
  constructor(private readonly eleitorService: EleitorService) {}

  /**
   * GET /api/admin/eleitores?edicaoId=1&setorId=2&status=ativo&busca=joao&pagina=1&limite=50
   * Lista eleitores com filtros e paginação.
   */
  @Get()
  async listar(
    @Query('edicaoId') edicaoId: string,
    @Query('setorId') setorId?: string,
    @Query('status') status?: string,
    @Query('busca') busca?: string,
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string
  ) {
    const eid = parseInt(edicaoId);
    if (isNaN(eid)) throw new BadRequestException('edicaoId inválido');

    return this.eleitorService.listar({
      edicaoId: eid,
      setorId: setorId ? parseInt(setorId) : undefined,
      status,
      busca,
      pagina: pagina ? parseInt(pagina) : 1,
      limite: limite ? parseInt(limite) : 50,
    });
  }

  /**
   * PUT /api/admin/eleitores/:id/bloquear
   * Body: { motivoBloqueio: string }
   */
  @Put(':id/bloquear')
  async bloquear(@Param('id') id: string, @Body() dto: BloqueioDto, @Req() req: Request) {
    const eid = parseInt(id);
    if (isNaN(eid)) throw new BadRequestException('ID inválido');

    const ator = (req as Request & { adminUsername?: string }).adminUsername || 'admin';

    try {
      return await this.eleitorService.bloquear(eid, dto, ator);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao bloquear eleitor'
      );
    }
  }

  /**
   * PUT /api/admin/eleitores/:id/desbloquear
   */
  @Put(':id/desbloquear')
  async desbloquear(@Param('id') id: string, @Req() req: Request) {
    const eid = parseInt(id);
    if (isNaN(eid)) throw new BadRequestException('ID inválido');

    const ator = (req as Request & { adminUsername?: string }).adminUsername || 'admin';

    try {
      return await this.eleitorService.desbloquear(eid, ator);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao desbloquear eleitor'
      );
    }
  }
}
