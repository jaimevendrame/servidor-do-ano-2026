/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PainelAdmin {
  edicaoId: number;
  totalEleitores: number;
  totalParticiparam: number;
  percentual: number;
  votacaoAberta: boolean;
  // REGRA #1: Nenhuma distribuição de votos. Nenhum nome de candidato. Nenhum ranking.
}

/**
 * Painel do admin durante a votação.
 *
 * REGRA INVIOLÁVEL #1: NUNCA exibe parcial de votos durante a votação.
 * Apenas o total de participação (quantos votaram), NUNCA a distribuição.
 */
@Injectable()
export class PainelAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async obter(edicaoId: number): Promise<PainelAdmin> {
    const janela = await this.prisma.janelaVotacao.findUnique({
      where: { edicaoId },
    });

    const agora = new Date();
    const votacaoAberta = janela
      ? ((agora >= janela.dataInicio && agora <= janela.dataFim) || janela.abertaManual) && !janela.fechadaManual
      : false;

    const totalEleitores = await this.prisma.eleitor.count({ where: { edicaoId } });
    const totalParticiparam = await this.prisma.participacao.count({ where: { edicaoId } });

    const percentual = totalEleitores > 0
      ? Math.round((totalParticiparam / totalEleitores) * 10000) / 100
      : 0;

    return {
      edicaoId,
      totalEleitores,
      totalParticiparam,
      percentual,
      votacaoAberta,
      // NÃO retorna votos, candidatos, ranking, parciais — NUNCA
    };
  }
}
