/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarCandidatoDto, AtualizarCandidatoDto } from './dto/candidato.dto';

@Injectable()
export class CandidatosService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarCandidatoDto) {
    // Valida: setor pertence a edicao
    const setor = await this.prisma.setor.findFirst({
      where: { id: dto.setorId, edicaoId: dto.edicaoId },
    });
    if (!setor) throw new Error('Setor nao encontrado nesta edicao');

    // Se eleitorId, valida que eleitor existe e pertence ao setor
    if (dto.eleitorId) {
      const eleitor = await this.prisma.eleitor.findFirst({
        where: { id: dto.eleitorId, setorId: dto.setorId, edicaoId: dto.edicaoId },
      });
      if (!eleitor) throw new Error('Eleitor nao encontrado ou nao pertence ao setor');
    }

    return this.prisma.candidato.create({
      data: {
        edicaoId: dto.edicaoId,
        setorId: dto.setorId,
        eleitorId: dto.eleitorId || null,
        nome: dto.nome,
        cargo: dto.cargo || null,
        ordemExibicao: dto.ordemExibicao ?? 0,
      },
    });
  }

  async listarPorSetor(edicaoId: number, setorId: number) {
    return this.prisma.candidato.findMany({
      where: { edicaoId, setorId },
      orderBy: { ordemExibicao: 'asc' },
    });
  }

  async listarPorEdicao(edicaoId: number) {
    return this.prisma.candidato.findMany({
      where: { edicaoId },
      include: { setor: true },
      orderBy: [{ setorId: 'asc' }, { ordemExibicao: 'asc' }],
    });
  }

  async atualizar(id: number, dto: AtualizarCandidatoDto) {
    return this.prisma.candidato.update({
      where: { id },
      data: {
        ...(dto.nome !== undefined && { nome: dto.nome }),
        ...(dto.cargo !== undefined && { cargo: dto.cargo }),
        ...(dto.ordemExibicao !== undefined && { ordemExibicao: dto.ordemExibicao }),
      },
    });
  }

  async remover(id: number) {
    return this.prisma.candidato.delete({ where: { id } });
  }
}
