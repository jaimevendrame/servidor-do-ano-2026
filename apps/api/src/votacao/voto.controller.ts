/* eslint-disable prettier/prettier */
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { VotoService, VotoDto, VotoResult } from './voto.service';

@Controller('voto')
export class VotoController {
  constructor(private readonly votoService: VotoService) {}

  @Post()
  async votar(@Body() dto: VotoDto): Promise<VotoResult> {
    try {
      return await this.votoService.registrar(dto);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro ao registrar voto');
    }
  }
}