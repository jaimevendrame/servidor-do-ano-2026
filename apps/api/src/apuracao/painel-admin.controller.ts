/* eslint-disable prettier/prettier */
import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { PainelAdminService, PainelAdmin } from './painel-admin.service';

@Controller('admin/painel')
export class PainelAdminController {
  constructor(private readonly painelService: PainelAdminService) {}

  @Get(':edicaoId')
  async obter(@Param('edicaoId') edicaoId: string): Promise<PainelAdmin> {
    const id = parseInt(edicaoId);
    if (isNaN(id)) throw new BadRequestException('edicaoId invalido');
    return this.painelService.obter(id);
  }
}
