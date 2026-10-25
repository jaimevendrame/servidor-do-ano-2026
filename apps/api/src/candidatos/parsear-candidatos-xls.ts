import * as ExcelJS from 'exceljs';
import { LinhaCandidatoRaw } from './dto/importar-candidatos.dto';

const MAPA_COLUNAS: Record<string, string[]> = {
  nome: ['nome', 'nome completo', 'candidato', 'nome do candidato', 'servidor'],
  setor: ['setor', 'lotacao', 'setor/lotacao', 'secretaria', 'departamento', 'unidade'],
  cargo: ['cargo', 'funcao'],
  cpf: ['cpf'],
  ordemExibicao: ['ordem', 'ordem exibicao', 'ordem de exibicao', 'posicao'],
};

const COLUNAS_OBRIGATORIAS = ['nome', 'setor'];

function normalizarTexto(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function mapearColunas(headers: string[]): {
  mapeamento: Record<string, number>;
  faltando: string[];
} {
  const mapeamento: Record<string, number> = {};
  const headersNormalizados = headers.map(h => normalizarTexto(h));

  for (const [campo, variantes] of Object.entries(MAPA_COLUNAS)) {
    const variantesNorm = variantes.map(v => normalizarTexto(v));
    const idx = headersNormalizados.findIndex(h => variantesNorm.includes(h));
    if (idx !== -1) {
      mapeamento[campo] = idx + 1; // 1-indexed para ExcelJS
    }
  }

  const faltando = COLUNAS_OBRIGATORIAS.filter(c => !mapeamento[c]);
  return { mapeamento, faltando };
}

function extrairTextoCelula(valor: unknown): string | undefined {
  if (valor === null || valor === undefined) return undefined;
  if (typeof valor === 'string') return valor.trim() || undefined;
  if (typeof valor === 'number') return String(valor);
  if (typeof valor === 'object') {
    const obj = valor as Record<string, unknown>;
    if ('text' in obj && typeof obj.text === 'string') return obj.text.trim() || undefined;
    if ('result' in obj && obj.result !== undefined && obj.result !== null) {
      return String(obj.result).trim() || undefined;
    }
  }
  return String(valor).trim() || undefined;
}

export interface ResultadoParsingCandidatos {
  linhas: LinhaCandidatoRaw[];
  totalLinhas: number;
  colunasFaltando: string[];
}

export async function parsearCandidatosXls(buffer: Buffer): Promise<ResultadoParsingCandidatos> {
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

  const linhas: LinhaCandidatoRaw[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // pular cabeçalho

    const nome = extrairTextoCelula(row.getCell(mapeamento.nome).value);
    const setor = extrairTextoCelula(row.getCell(mapeamento.setor).value);
    const cargo = mapeamento.cargo
      ? extrairTextoCelula(row.getCell(mapeamento.cargo).value)
      : undefined;
    const cpf = mapeamento.cpf ? extrairTextoCelula(row.getCell(mapeamento.cpf).value) : undefined;

    let ordemExibicao: number | undefined;
    if (mapeamento.ordemExibicao) {
      const valOrdem = extrairTextoCelula(row.getCell(mapeamento.ordemExibicao).value);
      if (valOrdem && !isNaN(Number(valOrdem))) {
        ordemExibicao = parseInt(valOrdem, 10);
      }
    }

    // Ignora linha se estiver completamente em branco
    if (!nome && !setor && !cargo && !cpf) {
      return;
    }

    // Ignora linha se for linha de totais ou rodapé de relatório
    const nomeNorm = normalizarTexto(nome || '');
    const setorNorm = normalizarTexto(setor || '');
    if (
      nomeNorm.startsWith('total de') ||
      nomeNorm === 'total' ||
      setorNorm.startsWith('total de') ||
      setorNorm === 'total'
    ) {
      return;
    }

    linhas.push({
      linhaOriginal: rowNumber,
      nome,
      setor,
      cargo,
      cpf,
      ordemExibicao,
    });
  });

  return { linhas, totalLinhas: linhas.length, colunasFaltando: [] };
}
