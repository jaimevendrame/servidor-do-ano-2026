/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DIAS_RETENCAO = 90;

export interface ResultadoExpurgo {
  eleitoresRemovidos: number;
  participacoesRemovidas: number;
  logsRemovidos: number;
  votosRemovidos: number;
  candidatosRemovidos: number;
}

/**
 * Rotina de retenção: expurga dados pessoais 90 dias após divulgação.
 *
 * PRD §8.4: base de eleitores e logs eliminados 90 dias após divulgação.
 * Votos (sem vínculo com eleitor) podem ser mantidos para auditoria estatística,
 * mas removemos por precaução (setores pequenos = risco de dedução).
 */
@Injectable()
export class RetencaoService {
  constructor(private readonly prisma: PrismaService) {}

  async verificarElegibilidade(edicaoId: number): Promise<{ elegivel: boolean; diasRestantes: number }> {
    const edicao = await this.prisma.edicao.findUnique({ where: { id: edicaoId } });
    if (!edicao) throw new Error('Edicao nao encontrada');

    // Usa criadoEm como proxy da divulgação (admin controla quando publicar)
    const janela = await this.prisma.janelaVotacao.findUnique({ where: { edicaoId } });
    if (!janela || !janela.fechadaManual) {
      return { elegivel: false, diasRestantes: DIAS_RETENCAO };
    }

    const dataReferencia = janela.atualizadoEm; // data do fechamento manual
    const diasPassados = Math.floor((Date.now() - dataReferencia.getTime()) / (1000 * 60 * 60 * 24));
    const diasRestantes = Math.max(0, DIAS_RETENCAO - diasPassados);

    return { elegivel: diasRestantes === 0, diasRestantes };
  }

  async executar(edicaoId: number, ator: string): Promise<ResultadoExpurgo> {
    const { elegivel } = await this.verificarElegibilidade(edicaoId);
    if (!elegivel) throw new Error('Edicao nao elegivel para expurgo (90 dias nao completados)');

    // Ordem: dependencias primeiro
    const participacoesRemovidas = await this.prisma.participacao.deleteMany({ where: { edicaoId } });
    const votosRemovidos = await this.prisma.voto.deleteMany({ where: { edicaoId } });
    const candidatosRemovidos = await this.prisma.candidato.deleteMany({ where: { edicaoId } });
    const eleitoresRemovidos = await this.prisma.eleitor.deleteMany({ where: { edicaoId } });
    const logsRemovidos = await this.prisma.logAuditoria.deleteMany({});

    // Registra o próprio expurgo (novo log pós-limpeza)
    await this.prisma.logAuditoria.create({
      data: {
        ator,
        acao: 'EXPURGO_RETENCAO',
        payload: {
          edicaoId,
          eleitoresRemovidos: eleitoresRemovidos.count,
          votosRemovidos: votosRemovidos.count,
        },
      },
    });

    return {
      eleitoresRemovidos: eleitoresRemovidos.count,
      participacoesRemovidas: participacoesRemovidas.count,
      logsRemovidos: logsRemovidos.count,
      votosRemovidos: votosRemovidos.count,
      candidatosRemovidos: candidatosRemovidos.count,
    };
  }
}
