/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { VotoService, VotoDto, VotoResult } from './voto.service';
import { EleitorAuthGuard } from '../auth/eleitor-auth.guard';

@Controller('voto')
export class VotoController {
  constructor(private readonly votoService: VotoService) {}

  /**
   * POST /api/voto
   *
   * Exige JWT de eleitor: payload.sub DEVE ser igual a body.eleitorId.
   * Sem isso, qualquer pessoa com um eleitorId valido votaria por outra.
   * Ver issue #105.
   */
  @Post()
  @UseGuards(EleitorAuthGuard)
  async votar(@Body() dto: VotoDto): Promise<VotoResult> {
    try {
      return await this.votoService.registrar(dto);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro ao registrar voto');
    }
  }
}
