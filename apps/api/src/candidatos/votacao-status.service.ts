/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VotacaoStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async setorEhVotavel(edicaoId: number, setorId: number): Promise<boolean> {
    const count = await this.prisma.candidato.count({
      where: { edicaoId, setorId },
    });
    return count >= 2;
  }

  async motivoSetorNaoVotavel(edicaoId: number, setorId: number): Promise<string | null> {
    const count = await this.prisma.candidato.count({
      where: { edicaoId, setorId },
    });
    if (count === 0) return 'SETOR_SEM_CANDIDATOS';
    if (count === 1) return 'SETOR_COM_UM_CANDIDATO';
    return null;
  }
}
