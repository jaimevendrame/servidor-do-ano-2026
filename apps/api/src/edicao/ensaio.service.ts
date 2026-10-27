/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ResultadoLimpezaEnsaio {
  edicaoId: number;
  votosRemovidos: number;
  participacoesRemovidas: number;
  /** Preservados propositalmente (opcao "b": base de cadastro permanece). */
  candidatosPreservados: number;
  eleitoresPreservados: number;
  setoresPreservados: number;
}

export interface previa {
  edicaoId: number;
  votos: number;
  participacoes: number;
  candidatos: number;
  eleitores: number;
  setores: number;
  /** true se a edicao tem votos E a janela nao esta em controle automatico. */
  atencao: string | null;
}

/**
 * Limpeza de ensaio: apaga APENAS os votos e participacoes de uma edicao.
 *
 * Preserva candidatos, eleitores, setores, janela e a propria edicao, para que
 * a votacao real use exatamente a mesma base de cadastro aprovada pela comissao.
 *
 * Diferente do expurgo de LGPD (RetencaoService), que so pode rodar 90 dias
 * apos o fechamento e apaga tudo da edicao.
 *
 * Ver issue #106.
 */
@Injectable()
export class EnsaioService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna o que seria removido, sem alterar nada. Usado para confirmacao
   * antes de executar a limpeza.
   */
  async previa(edicaoId: number): Promise<previa> {
    const edicao = await this.prisma.edicao.findUnique({
      where: { id: edicaoId },
      include: { janela: true },
    });
    if (!edicao) throw new BadRequestException(`Edicao ${edicaoId} nao encontrada`);

    const [votos, participacoes, candidatos, eleitores, setores] = await Promise.all([
      this.prisma.voto.count({ where: { edicaoId } }),
      this.prisma.participacao.count({ where: { edicaoId } }),
      this.prisma.candidato.count({ where: { edicaoId } }),
      this.prisma.eleitor.count({ where: { edicaoId } }),
      this.prisma.setor.count({ where: { edicaoId } }),
    ]);

    let atencao: string | null = null;
    if (votos > 0) {
      const janela = edicao.janela;
      const controladaAutomaticamente =
        !janela || (!janela.abertaManual && !janela.fechadaManual);
      if (!controladaAutomaticamente) {
        atencao =
          'A janela esta sob controle manual (aberta/fechada). Confira se estes votos sao de ENSAIO e nao de votacao real antes de limpar.';
      }
    }

    return { edicaoId, votos, participacoes, candidatos, eleitores, setores, atencao };
  }

  /**
   * Executa a limpeza: apaga votos e participacoes da edicao.
   * Preserva candidatos, eleitores, setores, janela e edicao.
   */
  async limpar(edicaoId: number, ator: string): Promise<ResultadoLimpezaEnsaio> {
    const edicao = await this.prisma.edicao.findUnique({ where: { id: edicaoId } });
    if (!edicao) throw new BadRequestException(`Edicao ${edicaoId} nao encontrada`);

    const [candidatosPreservados, eleitoresPreservados, setoresPreservados] = await Promise.all([
      this.prisma.candidato.count({ where: { edicaoId } }),
      this.prisma.eleitor.count({ where: { edicaoId } }),
      this.prisma.setor.count({ where: { edicaoId } }),
    ]);

    // Ordem importa por causa das FKs: votos -> participacoes.
    // Nenhuma FK aponta de Voto/Participacao para Candidato/Eleitor de forma
    // que impeca a remocao (regra #2: sao tabelas independentes).
    const [votos, participacoes] = await this.prisma.$transaction([
      this.prisma.voto.deleteMany({ where: { edicaoId } }),
      this.prisma.participacao.deleteMany({ where: { edicaoId } }),
    ]);

    await this.prisma.logAuditoria.create({
      data: {
        ator,
        acao: 'ENSAIO_LIMPO',
        payload: {
          edicaoId,
          votosRemovidos: votos.count,
          participacoesRemovidas: participacoes.count,
          candidatosPreservados,
          eleitoresPreservados,
          setoresPreservados,
        },
      },
    });

    return {
      edicaoId,
      votosRemovidos: votos.count,
      participacoesRemovidas: participacoes.count,
      candidatosPreservados,
      eleitoresPreservados,
      setoresPreservados,
    };
  }
}
