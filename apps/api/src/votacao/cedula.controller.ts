/* eslint-disable prettier/prettier */
import { Controller, Get, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { CedulaService, Cedula } from './cedula.service';
import { EleitorAuthGuard } from '../auth/eleitor-auth.guard';

@Controller('cedula')
export class CedulaController {
  constructor(private readonly cedulaService: CedulaService) {}

  /**
   * GET /api/cedula/:eleitorId
   *
   * Exige JWT de elector: payload.sub DEVE ser igual a :eleitorId.
   * A cedula so deve ser vista pelo proprio elector.
   * Ver issue #105.
   */
  @Get(':eleitorId')
  @UseGuards(EleitorAuthGuard)
  async obter(@Param('eleitorId') electorId: string): Promise<Cedula> {
    const id = parseInt(electorId, 10);
    if (isNaN(id)) throw new BadRequestException('eleitorId invalido');
    try {
      return await this.cedulaService.obter(id);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro');
    }
  }
}
