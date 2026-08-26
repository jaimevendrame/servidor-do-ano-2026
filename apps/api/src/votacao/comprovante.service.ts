/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-require-imports */
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import PDFDocument = require('pdfkit');
import { PrismaService } from '../prisma/prisma.service';

/**
 * Gera comprovante de participação em PDF.
 *
 * REGRA #4: NUNCA contém o nome do candidato votado.
 *
 * Conteúdo: brasão, nome da premiação, edição, setor do eleitor,
 * confirmação textual de participação, timestamp, hash de verificação.
 */
@Injectable()
export class ComprovanteService {
  constructor(private readonly prisma: PrismaService) {}

  async gerar(eleitorId: number): Promise<Buffer> {
    const participacao = await this.prisma.participacao.findFirst({
      where: { eleitorId },
      include: {
        eleitor: { include: { setor: true } },
        edicao: true,
      },
    });

    if (!participacao) throw new Error('Participacao nao encontrada');

    const eleitor = participacao.eleitor;
    const setor = eleitor.setor;
    const edicao = participacao.edicao;

    // Hash de verificação
    const hashInput = `${eleitor.id}|${edicao.ano}|${participacao.registradoEm.toISOString()}`;
    const hash = createHash('sha256').update(hashInput).digest('hex').substring(0, 16);

    return this.gerarPdf({
      nomeEleitor: eleitor.nome,
      setor: setor.nomeExibido,
      edicao: edicao.ano,
      timestamp: participacao.registradoEm,
      hash,
    });
  }

  private gerarPdf(dados: {
    nomeEleitor: string;
    setor: string;
    edicao: number;
    timestamp: Date;
    hash: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, compress: false });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cabeçalho
      doc.fontSize(20).text('PREFEITURA MUNICIPAL', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).text(`Servidor do Ano ${dados.edicao}`, { align: 'center' });
      doc.moveDown(2);

      // Corpo
      doc.fontSize(14).text('COMPROVANTE DE PARTICIPAÇÃO', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(12).text(`Eleitor: ${dados.nomeEleitor}`);
      doc.text(`Setor: ${dados.setor}`);
      doc.text(`Edição: ${dados.edicao}`);
      doc.text(`Data/hora do registro: ${dados.timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      doc.moveDown(2);

      doc.text('Este documento confirma que o eleitor acima participou da votação da premiação "Servidor do Ano".');
      doc.moveDown(1);
      doc.fontSize(10).text('Este comprovante NAO contem informacao sobre o candidato escolhido.');
      doc.moveDown(2);

      // Hash de verificação
      doc.fontSize(9).text(`Código de verificação: ${dados.hash}`, { align: 'right' });

      doc.end();
    });
  }
}
