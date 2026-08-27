/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CandidatoRanking {
  candidatoId: number;
  nome: string;
  cargo: string | null;
  votos: number;
}

export interface ResultadoSetor {
  setorId: number;
  setorNome: string;
  ranking: CandidatoRanking[];
  empate: boolean;
  empatados: CandidatoRanking[];
}

export interface ResultadoApuracao {
  edicaoId: number;
  votacaoFechada: boolean;
  setores: ResultadoSetor[];
}

/**
 * Apuração por setor.
 *
 * REGRA #8: Empate NUNCA é resolvido pelo sistema. Sinaliza e para.
 * REGRA #1: Só executa após fechamento da votação.
 */
@Injectable()
export class ApuracaoService {
  constructor(private readonly prisma: PrismaService) {}

  async apurar(edicaoId: number): Promise<ResultadoApuracao> {
    // Verifica se votação está fechada
    const janela = await this.prisma.janelaVotacao.findUnique({ where: { edicaoId } });
    const agora = new Date();
    // fechadaManual sobrepõe tudo; senão, aberta = dentro da janela ou abertaManual
    const aberta = janela
      ? ((agora >= janela.dataInicio && agora <= janela.dataFim) || janela.abertaManual) && !janela.fechadaManual
      : false;
    const votacaoFechada = !aberta;

    if (!votacaoFechada) {
      throw new Error('Apuracao so pode ser executada apos o fechamento da votacao');
    }

    const setores = await this.prisma.setor.findMany({ where: { edicaoId } });

    const resultados: ResultadoSetor[] = [];

    for (const setor of setores) {
      const candidatos = await this.prisma.candidato.findMany({
        where: { edicaoId, setorId: setor.id },
      });

      const ranking: CandidatoRanking[] = [];
      for (const candidato of candidatos) {
        const votos = await this.prisma.voto.count({
          where: { candidatoId: candidato.id, edicaoId },
        });
        ranking.push({
          candidatoId: candidato.id,
          nome: candidato.nome,
          cargo: candidato.cargo,
          votos,
        });
      }

      // Ordena por votos decrescente
      ranking.sort((a, b) => b.votos - a.votos);

      // Detecta empate no topo
      const empate = ranking.length >= 2 && ranking[0].votos === ranking[1].votos;
      const maxVotos = ranking.length > 0 ? ranking[0].votos : 0;
      const empatados = empate ? ranking.filter(c => c.votos === maxVotos) : [];

      resultados.push({
        setorId: setor.id,
        setorNome: setor.nomeExibido,
        ranking,
        empate,
        empatados,
        // REGRA #8: sistema NÃO resolve empate. Apenas sinaliza.
      });
    }

    return { edicaoId, votacaoFechada, setores: resultados };
  }
}
