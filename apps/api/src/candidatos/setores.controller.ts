/* eslint-disable prettier/prettier */
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('setores')
export class SetoresController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/setores?edicaoId=1
   * Lista setores de uma edicao (para popular selects no admin).
   */
  @Get()
  async listar(@Query('edicaoId') edicaoId: string) {
    const eid = parseInt(edicaoId);
    if (isNaN(eid)) throw new BadRequestException('edicaoId obrigatorio');

    return this.prisma.setor.findMany({
      where: { edicaoId: eid },
      orderBy: { nomeExibido: 'asc' },
    });
  }
}
