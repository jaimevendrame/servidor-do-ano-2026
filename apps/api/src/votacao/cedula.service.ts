/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ItemCedula {
  id: number;
  nome: string;
  cargo: string | null;
  ordem: number;
}

export interface Cedula {
  votavel: boolean;
  motivo?: 'SETOR_SEM_CANDIDATOS' | 'SETOR_COM_UM_CANDIDATO';
  candidatos: ItemCedula[];
}

@Injectable()
export class CedulaService {
  constructor(private readonly prisma: PrismaService) {}

  async obter(eleitorId: number): Promise<Cedula> {
    const eleitor = await this.prisma.eleitor.findUnique({
      where: { id: eleitorId },
    });
    if (!eleitor) throw new Error('Eleitor nao encontrado');

    const count = await this.prisma.candidato.count({
      where: { edicaoId: eleitor.edicaoId, setorId: eleitor.setorId },
    });

    if (count < 2) {
      return {
        votavel: false,
        motivo: count === 0 ? 'SETOR_SEM_CANDIDATOS' : 'SETOR_COM_UM_CANDIDATO',
        candidatos: [],
      };
    }

    const candidatos = await this.prisma.candidato.findMany({
      where: { edicaoId: eleitor.edicaoId, setorId: eleitor.setorId },
      orderBy: { ordemExibicao: 'asc' },
      select: { id: true, nome: true, cargo: true, ordemExibicao: true },
    });

    return {
      votavel: true,
      candidatos: candidatos.map((c: { id: number; nome: string; cargo: string | null; ordemExibicao: number }) => ({
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        ordem: c.ordemExibicao,
      })),
    };
  }
}