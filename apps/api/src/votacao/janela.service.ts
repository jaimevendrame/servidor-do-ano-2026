/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CriarJanelaDto {
  edicaoId: number;
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
}
