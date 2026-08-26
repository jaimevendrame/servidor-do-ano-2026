/* eslint-disable prettier/prettier */
import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { CedulaService, Cedula } from './cedula.service';

@Controller('cedula')
export class CedulaController {
  constructor(private readonly cedulaService: CedulaService) {}

  @Get(':eleitorId')
  async obter(@Param('eleitorId') eleitorId: string): Promise<Cedula> {
    const id = parseInt(eleitorId);
    if (isNaN(id)) throw new BadRequestException('eleitorId invalido');
    try {
      return await this.cedulaService.obter(id);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro');
    }
  }
}