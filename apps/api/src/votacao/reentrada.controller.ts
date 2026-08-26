/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { ReentradaService, StatusParticipacao } from './reentrada.service';

@Controller('reentrada')
export class ReentradaController {
  constructor(private readonly reentradaService: ReentradaService) {}

  @Get(':eleitorId')
  async status(
    @Param('eleitorId') eleitorId: string,
    @Query('edicaoId') edicaoId: string,
  ): Promise<StatusParticipacao> {
    const eid = parseInt(eleitorId);
    const edId = parseInt(edicaoId);
    if (isNaN(eid) || isNaN(edId)) {
      throw new BadRequestException('eleitorId e edicaoId obrigatorios');
    }
    return this.reentradaService.obterStatus(eid, edId);
  }
}
