/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LogEntry {
  id: number;
  ator: string;
  acao: string;
  payload: unknown;
  timestamp: Date;
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(ator: string, acao: string, payload?: unknown): Promise<void> {
    await this.prisma.logAuditoria.create({
      data: { ator, acao, payload: payload ?? null },
    });
  }

  async listar(filtros?: { ator?: string; acao?: string; de?: Date; ate?: Date }): Promise<LogEntry[]> {
    const where: Record<string, unknown> = {};
    if (filtros?.ator) where.ator = filtros.ator;
    if (filtros?.acao) where.acao = filtros.acao;
    if (filtros?.de || filtros?.ate) {
      where.timestamp = {};
      if (filtros?.de) (where.timestamp as Record<string, unknown>).gte = filtros.de;
      if (filtros?.ate) (where.timestamp as Record<string, unknown>).lte = filtros.ate;
    }

    return this.prisma.logAuditoria.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });
  }

  async exportarCsv(filtros?: { ator?: string; acao?: string; de?: Date; ate?: Date }): Promise<string> {
    const logs = await this.listar(filtros);
    const header = 'id,ator,acao,payload,timestamp';
    const linhas = logs.map(log => {
      const payload = log.payload ? JSON.stringify(log.payload).replace(/"/g, '""') : '';
      return `${log.id},"${log.ator}","${log.acao}","${payload}","${log.timestamp.toISOString()}"`;
    });
    return [header, ...linhas].join('\n');
  }
}
