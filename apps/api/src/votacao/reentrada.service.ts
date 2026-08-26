/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StatusParticipacao {
  jaVotou: boolean;
  registradoEm: Date | null;
}

/**
 * Consulta status de participação do eleitor.
 * NUNCA revela em quem votou — busca apenas Participacao.
 */
@Injectable()
export class ReentradaService {
  constructor(private readonly prisma: PrismaService) {}

  async obterStatus(eleitorId: number, edicaoId: number): Promise<StatusParticipacao> {
    const participacao = await this.prisma.participacao.findUnique({
      where: { eleitorId_edicaoId: { eleitorId, edicaoId } },
    });

    if (!participacao) {
      return { jaVotou: false, registradoEm: null };
    }

    return { jaVotou: true, registradoEm: participacao.registradoEm };
  }
}
