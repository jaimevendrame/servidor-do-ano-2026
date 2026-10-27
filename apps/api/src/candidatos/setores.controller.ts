/* eslint-disable prettier/prettier */
import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('setores')
export class SetoresController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/setores?edicaoId=1
   * Lista setores de uma edicao (para popular selects no admin).
   *
   * Exige AdminAuthGuard: sao usados apenas pelo painel administrativo e
   * revelam a estrutura organizacional completa da edicao.
   * Ver issue #105.
   */
  @Get()
  @UseGuards(AdminAuthGuard)
  async listar(@Query('edicaoId') edicaoId: string) {
    const eid = parseInt(edicaoId);
    if (isNaN(eid)) throw new BadRequestException('edicaoId obrigatorio');

    return this.prisma.setor.findMany({
      where: { edicaoId: eid },
      orderBy: { nomeExibido: 'asc' },
    });
  }
}
