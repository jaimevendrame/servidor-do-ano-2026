/* eslint-disable prettier/prettier */
import * as ExcelJS from 'exceljs';
import { LinhaXlsRaw, ResultadoParsing } from './dto/linha-xls.dto';

const MAPA_COLUNAS: Record<string, string[]> = {
  nome: ['nome', 'nome completo', 'servidor', 'nome do servidor'],
  cpf: ['cpf'],
  dataNascimento: ['data de nascimento', 'data nascimento', 'dt nascimento', 'nascimento'],
  dataAdmissao: ['data de admissao', 'data admissao', 'dt admissao', 'admissao'],
  cargo: ['cargo', 'funcao'],
  setor: ['setor', 'lotacao', 'setor/lotacao', 'unidade'],
};

const COLUNAS_OBRIGATORIAS = ['nome', 'cpf', 'dataAdmissao', 'setor'];

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function mapearColunas(headers: string[]): { mapeamento: Record<string, number>; faltando: string[] } {
  const mapeamento: Record<string, number> = {};
  const headersNormalizados = headers.map(h => normalizarTexto(h));

  for (const [campo, variantes] of Object.entries(MAPA_COLUNAS)) {
    const variantesNorm = variantes.map(v => normalizarTexto(v));
    const idx = headersNormalizados.findIndex(h => variantesNorm.includes(h));
    if (idx !== -1) {
      mapeamento[campo] = idx + 1; // 1-indexed para o ExcelJS
    }
  }

  const faltando = COLUNAS_OBRIGATORIAS.filter(c => !mapeamento[c]);
  return { mapeamento, faltando };
}

function extrairTextoCelula(valor: unknown): string | undefined {
  if (valor === null || valor === undefined) return undefined;
  if (typeof valor === 'string') return valor.trim() || undefined;
  if (typeof valor === 'number') return String(valor);
  if (valor instanceof Date) {
    return valor.toISOString().split('T')[0];
  }
  if (typeof valor === 'object') {
    // Caso de hyperlink, rich text ou formula do ExcelJS
    const obj = valor as Record<string, unknown>;
    if ('text' in obj && typeof obj.text === 'string') return obj.text.trim() || undefined;
    if ('result' in obj && obj.result !== undefined && obj.result !== null) {
      return String(obj.result).trim() || undefined;
    }
  }
  return String(valor).trim() || undefined;
}

export async function parsearXls(buffer: Buffer): Promise<ResultadoParsing> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount === 0) {
    return { linhas: [], totalLinhas: 0, colunasFaltando: COLUNAS_OBRIGATORIAS };
  }

  const primeiraLinha = worksheet.getRow(1);
  const headers: string[] = [];
  primeiraLinha.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber - 1] = extrairTextoCelula(cell.value) || '';
  });

  if (headers.length === 0) {
    return { linhas: [], totalLinhas: 0, colunasFaltando: COLUNAS_OBRIGATORIAS };
  }

  const { mapeamento, faltando } = mapearColunas(headers);
  const totalLinhasDados = Math.max(0, worksheet.rowCount - 1);

  if (faltando.length > 0) {
    return { linhas: [], totalLinhas: totalLinhasDados, colunasFaltando: faltando };
  }

  const linhas: LinhaXlsRaw[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // pular cabeçalho

    const nome = extrairTextoCelula(row.getCell(mapeamento.nome).value);
    const cpf = extrairTextoCelula(row.getCell(mapeamento.cpf).value);
    const dataNascimento = mapeamento.dataNascimento
      ? extrairTextoCelula(row.getCell(mapeamento.dataNascimento).value)
      : undefined;
    const dataAdmissao = extrairTextoCelula(row.getCell(mapeamento.dataAdmissao).value);
    const cargo = mapeamento.cargo
      ? extrairTextoCelula(row.getCell(mapeamento.cargo).value)
      : undefined;
    const setor = extrairTextoCelula(row.getCell(mapeamento.setor).value);

    // Ignora linha se estiver completamente em branco
    if (!nome && !cpf && !dataAdmissao && !setor) {
      return;
    }

    linhas.push({
      nome,
      cpf,
      dataNascimento,
      dataAdmissao,
      cargo,
      setor,
      linhaOriginal: rowNumber,
    });
  });

  return { linhas, totalLinhas: linhas.length, colunasFaltando: [] };
}
