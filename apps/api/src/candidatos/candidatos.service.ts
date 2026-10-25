/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { CriarCandidatoDto, AtualizarCandidatoDto } from './dto/candidato.dto';
import {
  ResultadoPreviewCandidatos,
  CandidatoPreviewItem,
  ConfirmarImportacaoCandidatosDto,
} from './dto/importar-candidatos.dto';
import { parsearCandidatosXls } from './parsear-candidatos-xls';
import { validarCPF } from '../importacao/validar-cpf';

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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

  /**
   * Processa o upload da planilha e retorna preview com validação detalhada
   */
  async previewImportacao(edicaoId: number, buffer: Buffer): Promise<ResultadoPreviewCandidatos> {
    const parsing = await parsearCandidatosXls(buffer);

    if (parsing.colunasFaltando.length > 0) {
      throw new BadRequestException(
        `Colunas obrigatórias faltando na planilha: ${parsing.colunasFaltando.join(', ')}`
      );
    }

    const [setoresEdicao, eleitoresEdicao, candidatosExistentes] = await Promise.all([
      this.prisma.setor.findMany({ where: { edicaoId } }),
      this.prisma.eleitor.findMany({ where: { edicaoId } }),
      this.prisma.candidato.findMany({ where: { edicaoId } }),
    ]);

    // Índices de setores
    const mapaSetoresPorNome = new Map<string, (typeof setoresEdicao)[0]>();
    for (const setor of setoresEdicao) {
      mapaSetoresPorNome.set(normalizarTexto(setor.nomeOficial), setor);
      mapaSetoresPorNome.set(normalizarTexto(setor.nomeExibido), setor);
    }

    // Índices de eleitores por CPF e por Nome
    const mapaEleitorPorCpf = new Map<string, (typeof eleitoresEdicao)[0]>();
    for (const el of eleitoresEdicao) {
      const cpfLimpo = el.cpf.replace(/\D/g, '');
      mapaEleitorPorCpf.set(cpfLimpo, el);
    }

    // Candidatos já cadastrados (para alerta de duplicata existente)
    const setCandidatosExistentes = new Set<string>();
    for (const cand of candidatosExistentes) {
      setCandidatosExistentes.add(`${cand.setorId}_${normalizarTexto(cand.nome)}`);
    }

    const itens: CandidatoPreviewItem[] = [];
    const setoresNaoEncontradosSet = new Set<string>();
    const chavesPlanilhaVistas = new Set<string>();

    let seqOrdem = 1;

    for (const linha of parsing.linhas) {
      const erros: string[] = [];
      const avisos: string[] = [];

      const nomeLimpo = linha.nome?.trim() || '';
      const setorDigitado = linha.setor?.trim() || '';
      const cargoLimpo = linha.cargo?.trim() || undefined;
      const cpfLimpo = linha.cpf ? linha.cpf.replace(/\D/g, '') : undefined;

      if (!nomeLimpo) {
        erros.push('Nome do candidato é obrigatório.');
      }

      if (!setorDigitado) {
        erros.push('Setor é obrigatório.');
      }

      const setorEncontrado = mapaSetoresPorNome.get(normalizarTexto(setorDigitado));
      if (setorDigitado && !setorEncontrado) {
        erros.push(`Setor "${setorDigitado}" não encontrado nos setores cadastrados da edição.`);
        setoresNaoEncontradosSet.add(setorDigitado);
      }

      let eleitorId: number | undefined;
      if (cpfLimpo) {
        if (!validarCPF(cpfLimpo)) {
          avisos.push(`CPF informado (${linha.cpf}) é inválido.`);
        } else {
          const eleitor = mapaEleitorPorCpf.get(cpfLimpo);
          if (eleitor) {
            eleitorId = eleitor.id;
            if (setorEncontrado && eleitor.setorId !== setorEncontrado.id) {
              avisos.push(
                `Eleitor com este CPF está registrado em outro setor no banco (Setor ID ${eleitor.setorId}).`
              );
            }
          }
        }
      }

      // Validação de duplicidade na planilha
      if (nomeLimpo && setorEncontrado) {
        const chavePlanilha = `${setorEncontrado.id}_${normalizarTexto(nomeLimpo)}`;
        if (chavesPlanilhaVistas.has(chavePlanilha)) {
          erros.push('Candidato duplicado para o mesmo setor nesta planilha.');
        } else {
          chavesPlanilhaVistas.add(chavePlanilha);
        }

        if (setCandidatosExistentes.has(chavePlanilha)) {
          avisos.push('Candidato com este nome já está cadastrado neste setor na edição.');
        }
      }

      const status = erros.length > 0 ? 'erro' : avisos.length > 0 ? 'aviso' : 'valido';

      itens.push({
        linhaOriginal: linha.linhaOriginal,
        nome: nomeLimpo,
        cargo: cargoLimpo,
        cpf: cpfLimpo,
        setorDigitado,
        setorId: setorEncontrado?.id,
        setorNome: setorEncontrado ? setorEncontrado.nomeExibido : undefined,
        eleitorId,
        ordemExibicao: linha.ordemExibicao ?? seqOrdem++,
        status,
        erros,
        avisos,
      });
    }

    const totalValidos = itens.filter(i => i.status === 'valido' || i.status === 'aviso').length;
    const totalErros = itens.filter(i => i.status === 'erro').length;
    const totalAvisos = itens.filter(i => i.status === 'aviso').length;

    return {
      totalLinhas: itens.length,
      totalValidos,
      totalErros,
      totalAvisos,
      setoresNaoEncontrados: Array.from(setoresNaoEncontradosSet),
      itens,
    };
  }

  /**
   * Confirma a importação em lote dos candidatos validados
   */
  async confirmarImportacao(dto: ConfirmarImportacaoCandidatosDto) {
    const { edicaoId, candidatos, substituirExistentes } = dto;

    if (!candidatos || candidatos.length === 0) {
      throw new BadRequestException('Nenhum candidato para importar.');
    }

    return this.prisma.$transaction(async tx => {
      // Se solicitado substituir existentes, verifica se há votos computados
      if (substituirExistentes) {
        const totalVotos = await tx.voto.count({ where: { edicaoId } });
        if (totalVotos > 0) {
          throw new BadRequestException(
            'Não é possível substituir candidatos: já existem votos computados nesta edição.'
          );
        }
        await tx.candidato.deleteMany({ where: { edicaoId } });
      }

      let inseridos = 0;
      for (const c of candidatos) {
        await tx.candidato.create({
          data: {
            edicaoId,
            setorId: c.setorId,
            nome: c.nome.trim(),
            cargo: c.cargo?.trim() || null,
            eleitorId: c.eleitorId || null,
            ordemExibicao: c.ordemExibicao ?? 0,
          },
        });
        inseridos++;
      }

      return { totalImportados: inseridos };
    });
  }

  /**
   * Gera template XLSX de exemplo para download
   */
  async gerarModeloXlsx(edicaoId?: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const wsModelo = workbook.addWorksheet('Candidatos');

    wsModelo.columns = [
      { header: 'Nome Completo', key: 'nome', width: 35 },
      { header: 'CPF', key: 'cpf', width: 18 },
      { header: 'Setor/Lotacao', key: 'setor', width: 45 },
      { header: 'Cargo', key: 'cargo', width: 30 },
      { header: 'Ordem de Exibição', key: 'ordem', width: 20 },
    ];

    // Estilo cabeçalho
    wsModelo.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsModelo.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };

    // Exemplo de preenchimento
    wsModelo.addRow({
      nome: 'Maria da Silva (Exemplo)',
      cpf: '123.456.789-00',
      setor: 'Gabinete do Prefeito',
      cargo: 'Assessora',
      ordem: 1,
    });

    // Se edicaoId fornecida, adiciona aba com setores disponíveis
    if (edicaoId) {
      const setores = await this.prisma.setor.findMany({
        where: { edicaoId },
        orderBy: { nomeExibido: 'asc' },
      });

      const wsSetores = workbook.addWorksheet('Setores Cadastrados');
      wsSetores.columns = [
        { header: 'Nome do Setor (Use na planilha)', key: 'nome', width: 45 },
        { header: 'Nome Oficial', key: 'oficial', width: 45 },
      ];
      wsSetores.getRow(1).font = { bold: true };
      for (const s of setores) {
        wsSetores.addRow({ nome: s.nomeExibido, oficial: s.nomeOficial });
      }
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
