/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LinhaValidada } from './validar-linhas';
import { SetorNormalizado } from './normalizar-setores';

export interface ResultadoGravacao {
  setoresCriados: number;
  eleitoresNovos: number;
  eleitoresAtualizados: number;
  totalProcessados: number;
}

/**
 * Grava as linhas validadas e normalizadas no banco.
 *
 * PRD §7:
 * - Reimportação atualiza existentes por CPF
 * - Prevalece setor da última importação
 * - Bloqueada com votação aberta
 */
@Injectable()
export class GravacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async gravar(
    edicaoId: number,
    linhasValidas: LinhaValidada[],
    setoresNormalizados: SetorNormalizado[],
    ator: string
  ): Promise<ResultadoGravacao> {
    // 1. Bloqueia se votação aberta
    const janela = await this.prisma.janelaVotacao.findUnique({ where: { edicaoId } });
    if (janela) {
      const agora = new Date();
      const aberta = ((agora >= janela.dataInicio && agora <= janela.dataFim) || janela.abertaManual) && !janela.fechadaManual;
      if (aberta) {
        throw new Error('Reimportacao bloqueada enquanto a votacao esta aberta');
      }
    }

    // 2. Criar/atualizar setores
    let setoresCriados = 0;
    const mapaSetor = new Map<string, number>(); // nomeOficial → id

    for (const setor of setoresNormalizados) {
      const existente = await this.prisma.setor.findFirst({
        where: { edicaoId, nomeOficial: setor.nomeOficial },
      });

      if (existente) {
        mapaSetor.set(setor.nomeOficial, existente.id);
      } else {
        const criado = await this.prisma.setor.create({
          data: {
            edicaoId,
            nomeOficial: setor.nomeOficial,
            nomeExibido: setor.nomeExibido,
            agrupado: setor.agrupado,
          },
        });
        mapaSetor.set(setor.nomeOficial, criado.id);
        setoresCriados++;
      }
    }

    // Monta lookup: setor original → setor oficial (via origens)
    const setorOriginalParaOficial = new Map<string, string>();
    for (const setor of setoresNormalizados) {
      for (const origem of setor.origens) {
        setorOriginalParaOficial.set(origem, setor.nomeOficial);
      }
    }

    // 3. Upsert eleitores por CPF
    let eleitoresNovos = 0;
    let eleitoresAtualizados = 0;

    for (const linha of linhasValidas) {
      const nomeOficial = setorOriginalParaOficial.get(linha.setor);
      if (!nomeOficial) continue; // setor não mapeado (não deveria acontecer)
      const setorId = mapaSetor.get(nomeOficial);
      if (!setorId) continue;

      const existente = await this.prisma.eleitor.findFirst({
        where: { edicaoId, cpf: linha.cpf },
      });

      if (existente) {
        // Prevalece setor da última importação
        await this.prisma.eleitor.update({
          where: { id: existente.id },
          data: {
            nome: linha.nome,
            setorId,
            dataAdmissao: new Date(linha.dataAdmissao),
            cargo: linha.cargo || null,
          },
        });
        eleitoresAtualizados++;
      } else {
        await this.prisma.eleitor.create({
          data: {
            edicaoId,
            setorId,
            cpf: linha.cpf,
            nome: linha.nome,
            dataAdmissao: new Date(linha.dataAdmissao),
            cargo: linha.cargo || null,
          },
        });
        eleitoresNovos++;
      }
    }

    // 4. Log de auditoria
    await this.prisma.logAuditoria.create({
      data: {
        ator,
        acao: 'IMPORTACAO_GRAVADA',
        payload: {
          edicaoId,
          setoresCriados,
          eleitoresNovos,
          eleitoresAtualizados,
        },
      },
    });

    return {
      setoresCriados,
      eleitoresNovos,
      eleitoresAtualizados,
      totalProcessados: eleitoresNovos + eleitoresAtualizados,
    };
  }
}
