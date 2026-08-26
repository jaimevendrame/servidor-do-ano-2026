/* eslint-disable prettier/prettier */
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { VotacaoStatusService } from './votacao-status.service';

@Controller('votacao')
export class VotacaoStatusController {
  constructor(private readonly statusService: VotacaoStatusService) {}

  @Get('status-setor')
  async statusSetor(
    @Query('edicaoId') edicaoId: string,
    @Query('setorId') setorId: string,
  ): Promise<{ votavel: boolean; motivo: string | null }> {
    const eid = parseInt(edicaoId);
    const sid = parseInt(setorId);
    if (isNaN(eid) || isNaN(sid)) {
      throw new BadRequestException('edicaoId e setorId obrigatorios');
    }
    const votavel = await this.statusService.setorEhVotavel(eid, sid);
    const motivo = await this.statusService.motivoSetorNaoVotavel(eid, sid);
    return { votavel, motivo };
  }
}