/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';

export interface CandidatoRanking {
  candidatoId: number;
  nome: string;
  cargo: string | null;
  votos: number;
}

export interface ResultadoSetor {
  setorId: number;
  setorNome: string;
  ranking: CandidatoRanking[];
  empate: boolean;
  empatados: CandidatoRanking[];
}

export interface ResultadoApuracao {
  edicaoId: number;
  votacaoFechada: boolean;
  setores: ResultadoSetor[];
}

/**
 * Apuração por setor.
 *
 * REGRA #8: Empate NUNCA é resolvido pelo sistema. Sinaliza e para.
 * REGRA #1: Só executa após fechamento da votação.
 */
@Injectable()
export class ApuracaoService {
  constructor(private readonly prisma: PrismaService) {}

  async apurar(edicaoId: number): Promise<ResultadoApuracao> {
    // Verifica se votação está fechada
    const janela = await this.prisma.janelaVotacao.findUnique({ where: { edicaoId } });
    const agora = new Date();
    // fechadaManual sobrepõe tudo; senão, aberta = dentro da janela ou abertaManual
    const aberta = janela
      ? ((agora >= janela.dataInicio && agora <= janela.dataFim) || janela.abertaManual) && !janela.fechadaManual
      : false;
    const votacaoFechada = !aberta;

    if (!votacaoFechada) {
      throw new Error('Apuracao so pode ser executada apos o fechamento da votacao');
    }

    const setores = await this.prisma.setor.findMany({ where: { edicaoId } });

    const resultados: ResultadoSetor[] = [];

    for (const setor of setores) {
      const candidatos = await this.prisma.candidato.findMany({
        where: { edicaoId, setorId: setor.id },
      });

      const ranking: CandidatoRanking[] = [];
      for (const candidato of candidatos) {
        const votos = await this.prisma.voto.count({
          where: { candidatoId: candidato.id, edicaoId },
        });
        ranking.push({
          candidatoId: candidato.id,
          nome: candidato.nome,
          cargo: candidato.cargo,
          votos,
        });
      }

      // Ordena por votos decrescente
      ranking.sort((a, b) => b.votos - a.votos);

      // Detecta empate no topo
      const empate = ranking.length >= 2 && ranking[0].votos === ranking[1].votos;
      const maxVotos = ranking.length > 0 ? ranking[0].votos : 0;
      const empatados = empate ? ranking.filter(c => c.votos === maxVotos) : [];

      resultados.push({
        setorId: setor.id,
        setorNome: setor.nomeExibido,
        ranking,
        empate,
        empatados,
        // REGRA #8: sistema NÃO resolve empate. Apenas sinaliza.
      });
    }

    return { edicaoId, votacaoFechada, setores: resultados };
  }

  async exportarExcel(edicaoId: number): Promise<Buffer> {
    const resultado = await this.apurar(edicaoId);

    const edicao = await this.prisma.edicao.findUnique({
      where: { id: edicaoId },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Servidor do Ano';
    workbook.created = new Date();

    // Estilos padrão
    const headerFill: ExcelJS.FillPattern = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate-800
    };
    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    const titleFont: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 14,
      bold: true,
      color: { argb: 'FF0F172A' },
    };
    const borderPadrao: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };

    // ──────────────────────────────────────────────
    // Aba 1: Resumo Geral
    // ──────────────────────────────────────────────
    const wsResumo = workbook.addWorksheet('Resumo Geral');

    wsResumo.addRow([`Apuração — ${edicao?.nomePrefeitura || 'Prefeitura'} (${edicao?.ano || ''})`]);
    wsResumo.getCell('A1').font = titleFont;
    wsResumo.addRow([`Gerado em: ${new Date().toLocaleString('pt-BR')}`]);
    wsResumo.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
    wsResumo.addRow([]); // linha em branco

    const cabecalhoResumo = [
      'Setor',
      'Total de Candidatos',
      'Total de Votos',
      'Resultado',
      'Vencedor(es)',
      'Votos do Vencedor',
    ];
    const headerRowResumo = wsResumo.addRow(cabecalhoResumo);
    headerRowResumo.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = borderPadrao;
    });
    headerRowResumo.height = 24;

    let totalGeralVotos = 0;
    let totalGeralCandidatos = 0;

    for (const setor of resultado.setores) {
      const totalVotosSetor = setor.ranking.reduce((acc, c) => acc + c.votos, 0);
      totalGeralVotos += totalVotosSetor;
      totalGeralCandidatos += setor.ranking.length;

      let statusResultado = 'Definido';
      let nomesVencedores = '-';
      let votosVencedor = 0;

      if (setor.ranking.length === 0) {
        statusResultado = 'Sem candidatos';
      } else if (setor.empate) {
        statusResultado = 'EMPATE';
        nomesVencedores = setor.empatados.map((c) => c.nome).join(' / ');
        votosVencedor = setor.empatados[0]?.votos || 0;
      } else {
        statusResultado = 'Eleito';
        nomesVencedores = setor.ranking[0].nome;
        votosVencedor = setor.ranking[0].votos;
      }

      const row = wsResumo.addRow([
        setor.setorNome,
        setor.ranking.length,
        totalVotosSetor,
        statusResultado,
        nomesVencedores,
        votosVencedor,
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = borderPadrao;
        cell.font = { name: 'Calibri', size: 11 };
        if (colNumber === 2 || colNumber === 3 || colNumber === 6) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else if (colNumber === 4) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          if (statusResultado === 'EMPATE') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFEF3C7' }, // Amber-100
            };
            cell.font = { bold: true, color: { argb: 'FFB45309' } }; // Amber-700
          }
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    }

    // Linha de total no Resumo
    const totalRowResumo = wsResumo.addRow([
      'TOTAL GERAL',
      totalGeralCandidatos,
      totalGeralVotos,
      '',
      '',
      '',
    ]);
    totalRowResumo.eachCell((cell) => {
      cell.font = { bold: true, name: 'Calibri', size: 11 };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF1E293B' } },
        bottom: { style: 'double', color: { argb: 'FF1E293B' } },
      };
    });

    wsResumo.columns = [
      { width: 36 }, // Setor
      { width: 20 }, // Total de Candidatos
      { width: 16 }, // Total de Votos
      { width: 16 }, // Resultado
      { width: 40 }, // Vencedor(es)
      { width: 20 }, // Votos do Vencedor
    ];

    // ──────────────────────────────────────────────
    // Aba 2: Resultado por Setor (completo com ranking)
    // ──────────────────────────────────────────────
    const wsDetalhado = workbook.addWorksheet('Resultado por Setor');

    const cabecalhoDetalhado = [
      'Setor',
      'Posição',
      'Nome do Candidato',
      'Cargo',
      'Votos',
      '% no Setor',
      'Situação',
    ];
    const headerRowDetalhado = wsDetalhado.addRow(cabecalhoDetalhado);
    headerRowDetalhado.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = borderPadrao;
    });
    headerRowDetalhado.height = 24;

    for (const setor of resultado.setores) {
      const totalVotosSetor = setor.ranking.reduce((acc, c) => acc + c.votos, 0);

      setor.ranking.forEach((candidato, index) => {
        const posicao = `${index + 1}º`;
        const pct = totalVotosSetor > 0 ? (candidato.votos / totalVotosSetor) * 100 : 0;

        let situacao = '';
        if (index === 0 && !setor.empate) {
          situacao = 'Eleito(a)';
        } else if (setor.empate && setor.empatados.some((e) => e.candidatoId === candidato.candidatoId)) {
          situacao = 'Empate';
        }

        const row = wsDetalhado.addRow([
          setor.setorNome,
          posicao,
          candidato.nome,
          candidato.cargo || '',
          candidato.votos,
          `${pct.toFixed(1)}%`,
          situacao,
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = borderPadrao;
          cell.font = { name: 'Calibri', size: 11 };

          if (colNumber === 2 || colNumber === 7) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (colNumber === 5 || colNumber === 6) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }

          if (situacao === 'Eleito(a)') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFDCFCE7' }, // Emerald-100
            };
            if (colNumber === 3 || colNumber === 7) {
              cell.font = { bold: true, color: { argb: 'FF166534' } };
            }
          } else if (situacao === 'Empate') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFEF3C7' }, // Amber-100
            };
            if (colNumber === 3 || colNumber === 7) {
              cell.font = { bold: true, color: { argb: 'FFB45309' } };
            }
          }
        });
      });
    }

    wsDetalhado.columns = [
      { width: 34 }, // Setor
      { width: 10 }, // Posição
      { width: 38 }, // Nome do Candidato
      { width: 30 }, // Cargo
      { width: 12 }, // Votos
      { width: 14 }, // % no Setor
      { width: 16 }, // Situação
    ];

    // ──────────────────────────────────────────────
    // Aba 3: Empates (se houver)
    // ──────────────────────────────────────────────
    const setoresComEmpate = resultado.setores.filter((s) => s.empate);
    if (setoresComEmpate.length > 0) {
      const wsEmpates = workbook.addWorksheet('Empates para Comissão');

      wsEmpates.addRow(['Setores com Empate no 1º Lugar (Regra #8)']);
      wsEmpates.getCell('A1').font = titleFont;
      wsEmpates.addRow([
        'Conforme o regulamento da premiação, o sistema não desempata votos. A resolução cabe à comissão.',
      ]);
      wsEmpates.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
      wsEmpates.addRow([]);

      const cabecalhoEmpates = [
        'Setor',
        'Candidato Empatado',
        'Cargo',
        'Votos no Empate',
      ];
      const headerRowEmpates = wsEmpates.addRow(cabecalhoEmpates);
      headerRowEmpates.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFB45309' }, // Amber-700
        };
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = borderPadrao;
      });
      headerRowEmpates.height = 24;

      for (const setor of setoresComEmpate) {
        for (const candidato of setor.empatados) {
          const row = wsEmpates.addRow([
            setor.setorNome,
            candidato.nome,
            candidato.cargo || '',
            candidato.votos,
          ]);

          row.eachCell((cell, colNumber) => {
            cell.border = borderPadrao;
            cell.font = { name: 'Calibri', size: 11 };
            if (colNumber === 4) {
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
              cell.font = { bold: true };
            } else {
              cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }
          });
        }
      }

      wsEmpates.columns = [
        { width: 36 },
        { width: 38 },
        { width: 30 },
        { width: 18 },
      ];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

