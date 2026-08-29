/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CriarJanelaDto {
  edicaoId: number;
  dataInicio: string; // ISO
  dataFim: string; // ISO
  timezone?: string;
}

export interface AtualizarDatasDto {
  dataInicio: string; // ISO
  dataFim: string; // ISO
  timezone?: string;
}

export interface StatusJanela {
  aberta: boolean;
  dataInicio: Date;
  dataFim: Date;
  abertaManual: boolean;
  fechadaManual: boolean;
}

@Injectable()
export class JanelaService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarJanelaDto) {
    return this.prisma.janelaVotacao.create({
      data: {
        edicaoId: dto.edicaoId,
        dataInicio: new Date(dto.dataInicio),
        dataFim: new Date(dto.dataFim),
        timezone: dto.timezone || 'America/Sao_Paulo',
      },
    });
  }

  async status(edicaoId: number): Promise<StatusJanela | null> {
    const janela = await this.prisma.janelaVotacao.findUnique({
      where: { edicaoId },
    });
    if (!janela) return null;

    const agora = new Date();
    const dentroJanela = agora >= janela.dataInicio && agora <= janela.dataFim;
    const aberta = (dentroJanela || janela.abertaManual) && !janela.fechadaManual;

    return {
      aberta,
      dataInicio: janela.dataInicio,
      dataFim: janela.dataFim,
      abertaManual: janela.abertaManual,
      fechadaManual: janela.fechadaManual,
    };
  }

  async abrirManual(edicaoId: number, ator: string): Promise<void> {
    await this.prisma.janelaVotacao.update({
      where: { edicaoId },
      data: { abertaManual: true, fechadaManual: false },
    });
    await this.prisma.logAuditoria.create({
      data: { ator, acao: 'JANELA_ABERTA_MANUAL', payload: { edicaoId } },
    });
  }

  async fecharManual(edicaoId: number, ator: string): Promise<void> {
    await this.prisma.janelaVotacao.update({
      where: { edicaoId },
      data: { fechadaManual: true },
    });
    await this.prisma.logAuditoria.create({
      data: { ator, acao: 'JANELA_FECHADA_MANUAL', payload: { edicaoId } },
    });
  }

  /**
   * Atualiza as datas de início/fim da janela (upsert por edicaoId).
   * Cria a janela se ainda não existir, senão atualiza.
   * Rejeita se a votação está sob override manual (aberta/fechada manual).
   */
  async atualizarDatas(edicaoId: number, dto: AtualizarDatasDto, ator: string) {
    const inicio = new Date(dto.dataInicio);
    const fim = new Date(dto.dataFim);

    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      throw new BadRequestException('Datas inválidas');
    }
    if (inicio >= fim) {
      throw new BadRequestException('Data de início deve ser anterior à data de fim');
    }

    const existente = await this.prisma.janelaVotacao.findUnique({
      where: { edicaoId },
    });

    if (existente && (existente.abertaManual || existente.fechadaManual)) {
      throw new BadRequestException(
        'Não é possível alterar as datas: a votação está sob controle manual (aberta/fechada). Reative a janela automática primeiro.'
      );
    }

    const janela = await this.prisma.janelaVotacao.upsert({
      where: { edicaoId },
      create: {
        edicaoId,
        dataInicio: inicio,
        dataFim: fim,
        timezone: dto.timezone || 'America/Sao_Paulo',
      },
      update: {
        dataInicio: inicio,
        dataFim: fim,
        timezone: dto.timezone || 'America/Sao_Paulo',
      },
    });

    await this.prisma.logAuditoria.create({
      data: {
        ator,
        acao: 'JANELA_DATAS_ATUALIZADAS',
        payload: {
          edicaoId,
          dataInicio: inicio.toISOString(),
          dataFim: fim.toISOString(),
          timezone: janela.timezone,
        },
      },
    });

    return janela;
  }

  /**
   * Processa transições automáticas de TODAS as janelas de edições ativas.
   * Chamado pelo CRON a cada minuto.
   *
   * A abertura/fechamento efetivo já é calculado dinamicamente em status()
   * a partir das datas. Este método apenas:
   *  - registra em log a PRIMEIRA vez que a janela atinge dataInicio (abertura)
   *  - registra em log e seta fechadaManual quando atinge dataFim (fechamento
   *    definitivo — regra do PRD: após fechar, não reabre)
   *
   * Idempotente via flags aberturaAutoRegistrada / fechamentoAutoRegistrado.
   * Retorna o resumo das transições aplicadas (útil para testes/observabilidade).
   */
  async processarTransicoesAutomaticas(agora: Date = new Date()): Promise<{
    aberturas: number[];
    fechamentos: number[];
  }> {
    const aberturas: number[] = [];
    const fechamentos: number[] = [];

    // Só processa janelas de edições ativas
    const janelas = await this.prisma.janelaVotacao.findMany({
      where: { edicao: { ativo: true } },
    });

    for (const janela of janelas) {
      // Fechamento automático: passou de dataFim, ainda não registrado e não fechada manualmente
      if (agora >= janela.dataFim && !janela.fechamentoAutoRegistrado && !janela.fechadaManual) {
        await this.prisma.janelaVotacao.update({
          where: { edicaoId: janela.edicaoId },
          data: { fechadaManual: true, fechamentoAutoRegistrado: true },
        });
        await this.prisma.logAuditoria.create({
          data: {
            ator: 'sistema',
            acao: 'JANELA_FECHADA_AUTOMATICA',
            payload: { edicaoId: janela.edicaoId, dataFim: janela.dataFim.toISOString() },
          },
        });
        fechamentos.push(janela.edicaoId);
        continue; // não faz sentido também registrar abertura na mesma passada
      }

      // Abertura automática: dentro da janela, ainda não registrada
      if (agora >= janela.dataInicio && agora < janela.dataFim && !janela.aberturaAutoRegistrada) {
        await this.prisma.janelaVotacao.update({
          where: { edicaoId: janela.edicaoId },
          data: { aberturaAutoRegistrada: true },
        });
        await this.prisma.logAuditoria.create({
          data: {
            ator: 'sistema',
            acao: 'JANELA_ABERTA_AUTOMATICA',
            payload: { edicaoId: janela.edicaoId, dataInicio: janela.dataInicio.toISOString() },
          },
        });
        aberturas.push(janela.edicaoId);
      }
    }

    return { aberturas, fechamentos };
  }
}
