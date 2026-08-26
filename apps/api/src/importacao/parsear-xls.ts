import * as XLSX from 'xlsx';
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
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function mapearColunas(headers: string[]): { mapeamento: Record<string, string>; faltando: string[] } {
  const mapeamento: Record<string, string> = {};
  const headersNormalizados = headers.map(h => normalizarTexto(h));

  for (const [campo, variantes] of Object.entries(MAPA_COLUNAS)) {
    const variantesNorm = variantes.map(v => normalizarTexto(v));
    const idx = headersNormalizados.findIndex(h => variantesNorm.includes(h));
    if (idx !== -1) {
      mapeamento[campo] = headers[idx];
    }
  }

  const faltando = COLUNAS_OBRIGATORIAS.filter(c => !mapeamento[c]);
  return { mapeamento, faltando };
}

export function parsearXls(buffer: Buffer): ResultadoParsing {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const primeiraAba = workbook.SheetNames[0];
  const sheet = workbook.Sheets[primeiraAba];

  const dados: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: undefined,
    raw: false,
  });

  if (dados.length === 0) {
    return { linhas: [], totalLinhas: 0, colunasFaltando: COLUNAS_OBRIGATORIAS };
  }

  const headers = Object.keys(dados[0]);
  const { mapeamento, faltando } = mapearColunas(headers);

  if (faltando.length > 0) {
    return { linhas: [], totalLinhas: dados.length, colunasFaltando: faltando };
  }

  const linhas: LinhaXlsRaw[] = dados.map((row, idx) => ({
    nome: (row[mapeamento.nome] as string) || undefined,
    cpf: (row[mapeamento.cpf] as string) || undefined,
    dataNascimento: (row[mapeamento.dataNascimento] as string) || undefined,
    dataAdmissao: (row[mapeamento.dataAdmissao] as string) || undefined,
    cargo: (row[mapeamento.cargo] as string) || undefined,
    setor: (row[mapeamento.setor] as string) || undefined,
    linhaOriginal: idx + 2,
  }));

  return { linhas, totalLinhas: linhas.length, colunasFaltando: [] };
}
