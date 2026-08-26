/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { arredondarTimestamp } from '../common/helpers/round-timestamp';

export interface VotoDto {
  eleitorId: number;
  candidatoId: number;
}

export interface VotoResult {
  sucesso: boolean;
  jaVotou?: boolean;
  registradoEm?: Date;
}

@Injectable()
export class VotoService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(dto: VotoDto): Promise<VotoResult> {
    const eleitor = await this.prisma.eleitor.findUnique({
      where: { id: dto.eleitorId },
    });
    if (!eleitor) throw new Error('Eleitor nao encontrado');

    // Regra #7: idempotente — se já votou, retorna sem erro
    const jaVotou = await this.prisma.participacao.findUnique({
      where: { eleitorId_edicaoId: { eleitorId: dto.eleitorId, edicaoId: eleitor.edicaoId } },
    });
    if (jaVotou) {
      return { sucesso: true, jaVotou: true, registradoEm: jaVotou.registradoEm };
    }

    // Regra #6: janela validada no submit
    const janela = await this.prisma.janelaVotacao.findUnique({
      where: { edicaoId: eleitor.edicaoId },
    });
    if (!janela) throw new Error('Janela de votacao nao configurada');

    const agora = new Date();
    const aberta = (agora >= janela.dataInicio && agora <= janela.dataFim) || janela.abertaManual;
    const fechada = janela.fechadaManual;
    if (!aberta || fechada) throw new Error('Votacao nao esta aberta');

    // Valida candidato pertence ao setor do eleitor (regra #5)
    const candidato = await this.prisma.candidato.findFirst({
      where: { id: dto.candidatoId, setorId: eleitor.setorId, edicaoId: eleitor.edicaoId },
    });
    if (!candidato) throw new Error('Candidato invalido para o setor do eleitor');

    // Regra #3: timestamp arredondado
    const timestampArredondado = arredondarTimestamp(agora);

    // Gravação transacional — Participacao e Voto na mesma TX, SEM vínculo (regra #2)
    await this.prisma.$transaction([
      this.prisma.participacao.create({
        data: {
          eleitorId: dto.eleitorId,
          edicaoId: eleitor.edicaoId,
          registradoEm: timestampArredondado,
        },
      }),
      this.prisma.voto.create({
        data: {
          candidatoId: dto.candidatoId,
          setorId: eleitor.setorId,
          edicaoId: eleitor.edicaoId,
          registradoEm: timestampArredondado,
        },
      }),
    ]);

    return { sucesso: true, jaVotou: false, registradoEm: timestampArredondado };
  }
}
