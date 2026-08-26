/* eslint-disable prettier/prettier */
import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { ApuracaoService, ResultadoApuracao } from './apuracao.service';

@Controller('admin/apuracao')
export class ApuracaoController {
  constructor(private readonly apuracaoService: ApuracaoService) {}

  @Get(':edicaoId')
  async apurar(@Param('edicaoId') edicaoId: string): Promise<ResultadoApuracao> {
    const id = parseInt(edicaoId);
    if (isNaN(id)) throw new BadRequestException('edicaoId invalido');
    try {
      return await this.apuracaoService.apurar(id);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro');
    }
  }
}
