/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ReentradaService, StatusParticipacao } from './reentrada.service';
import { EleitorAuthGuard } from '../auth/eleitor-auth.guard';

@Controller('reentrada')
export class ReentradaController {
  constructor(private readonly reentradaService: ReentradaService) {}

  /**
   * GET /api/reentrada/:eleitorId?edicaoId=
   *
   * Exige JWT de elector: payload.sub DEVE ser igual a :eleitorId.
   * Sem isso, enumerar IDs revelaria quem ja votou.
   * Ver issue #105.
   */
  @Get(':eleitorId')
  @UseGuards(EleitorAuthGuard)
  async status(
    @Param('eleitorId') eleitorId: string,
    @Query('edicaoId') edicaoId: string,
  ): Promise<StatusParticipacao> {
    const eid = parseInt(eleitorId, 10);
    const edId = parseInt(edicaoId, 10);
    if (isNaN(eid) || isNaN(edId)) {
      throw new BadRequestException('eleitorId e edicaoId obrigatorios');
    }
    return this.reentradaService.obterStatus(eid, edId);
  }
}
