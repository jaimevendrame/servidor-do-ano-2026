/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../apuracao/auditoria.service';

export interface ListarEleitorDto {
  edicaoId: number;
  setorId?: number;
  status?: string;
  busca?: string; // CPF ou nome
  pagina?: number;
  limite?: number;
}

export interface BloqueioDto {
  motivoBloqueio: string;
}

@Injectable()
export class EleitorService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService
  ) {}

  /**
   * Listar eleitores com filtros e paginação
   */
  async listar(params: ListarEleitorDto) {
    const { edicaoId, setorId, status, busca, pagina = 1, limite = 50 } = params;

    if (!edicaoId || edicaoId <= 0) {
      throw new BadRequestException('edicaoId é obrigatório e deve ser > 0');
    }

    const skip = (pagina - 1) * limite;

    // Montar where clause dinâmico
    const where: Record<string, unknown> = { edicaoId };
    if (setorId && setorId > 0) where.setorId = setorId;
    if (status && status !== '') where.status = status;
    if (busca && busca.trim() !== '') {
      where.OR = [
        { cpf: { contains: busca, mode: 'insensitive' } },
        { nome: { contains: busca, mode: 'insensitive' } },
      ];
    }

    const [total, eleitores] = await Promise.all([
      this.prisma.eleitor.count({ where }),
      this.prisma.eleitor.findMany({
        where,
        include: { setor: true },
        orderBy: { cpf: 'asc' },
        skip,
        take: limite,
      }),
    ]);

    return {
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
      eleitores: eleitores.map(e => ({
        id: e.id,
        cpf: e.cpf,
        nome: e.nome,
        setorNome: e.setor.nomeExibido,
        status: e.status,
        motivoBloqueio: e.motivoBloqueio,
        dataBloqueio: e.dataBloqueio,
        criadoEm: e.criadoEm,
      })),
    };
  }

  /**
   * Bloquear eleitor
   */
  async bloquear(eleitorId: number, dto: BloqueioDto, ator: string) {
    const eleitor = await this.prisma.eleitor.findUnique({
      where: { id: eleitorId },
    });

    if (!eleitor) {
      throw new NotFoundException(`Eleitor ${eleitorId} não encontrado`);
    }

    if (eleitor.status === 'bloqueado') {
      throw new BadRequestException('Eleitor já está bloqueado');
    }

    if (!dto.motivoBloqueio || dto.motivoBloqueio.trim().length === 0) {
      throw new BadRequestException('Motivo do bloqueio é obrigatório');
    }

    const updated = await this.prisma.eleitor.update({
      where: { id: eleitorId },
      data: {
        status: 'bloqueado',
        motivoBloqueio: dto.motivoBloqueio,
        dataBloqueio: new Date(),
      },
    });

    // Registrar em auditoria
    await this.auditoria.registrar(ator, 'ELEITOR_BLOQUEADO', {
      eleitorId,
      cpf: eleitor.cpf,
      nome: eleitor.nome,
      motivo: dto.motivoBloqueio,
    });

    return {
      id: updated.id,
      cpf: updated.cpf,
      nome: updated.nome,
      status: updated.status,
      dataBloqueio: updated.dataBloqueio,
    };
  }

  /**
   * Desbloquear eleitor
   */
  async desbloquear(eleitorId: number, ator: string) {
    const eleitor = await this.prisma.eleitor.findUnique({
      where: { id: eleitorId },
    });

    if (!eleitor) {
      throw new NotFoundException(`Eleitor ${eleitorId} não encontrado`);
    }

    if (eleitor.status === 'ativo') {
      throw new BadRequestException('Eleitor já está ativo');
    }

    const updated = await this.prisma.eleitor.update({
      where: { id: eleitorId },
      data: {
        status: 'ativo',
        motivoBloqueio: null,
        dataBloqueio: null,
      },
    });

    // Registrar em auditoria
    await this.auditoria.registrar(ator, 'ELEITOR_DESBLOQUEADO', {
      eleitorId,
      cpf: eleitor.cpf,
      nome: eleitor.nome,
    });

    return {
      id: updated.id,
      cpf: updated.cpf,
      nome: updated.nome,
      status: updated.status,
    };
  }
}
