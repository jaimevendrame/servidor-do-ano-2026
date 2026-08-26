import * as XLSX from 'xlsx';
import { parsearXls } from './parsear-xls';

function criarXlsBuffer(dados: Record<string, unknown>[]): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dados);
  XLSX.utils.book_append_sheet(wb, ws, 'Planilha1');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

describe('parsearXls', () => {
  it('parseia arquivo com todas colunas obrigatorias', () => {
    const dados = [
      {
        Nome: 'Maria Silva',
        CPF: '111.222.333-44',
        'Data de Nascimento': '1990-01-15',
        'Data de Admissao': '2015-03-20',
        Cargo: 'Analista',
        Setor: 'Administrativo',
      },
      {
        Nome: 'Joao Souza',
        CPF: '555.666.777-88',
        'Data de Nascimento': '1985-06-10',
        'Data de Admissao': '2010-08-01',
        Cargo: 'Tecnico',
        Setor: 'TI',
      },
    ];

    const buffer = criarXlsBuffer(dados);
    const resultado = parsearXls(buffer);

    expect(resultado.colunasFaltando).toHaveLength(0);
    expect(resultado.totalLinhas).toBe(2);
    expect(resultado.linhas).toHaveLength(2);
    expect(resultado.linhas[0].nome).toBe('Maria Silva');
    expect(resultado.linhas[0].cpf).toBe('111.222.333-44');
    expect(resultado.linhas[0].setor).toBe('Administrativo');
    expect(resultado.linhas[0].linhaOriginal).toBe(2);
    expect(resultado.linhas[1].linhaOriginal).toBe(3);
  });

  it('aceita variantes de nome de coluna (case-insensitive, sem acento)', () => {
    const dados = [
      {
        'nome completo': 'Ana Costa',
        cpf: '999.888.777-66',
        'dt admissao': '2020-01-01',
        lotacao: 'Saude',
        funcao: 'Enfermeira',
        nascimento: '1992-12-25',
      },
    ];

    const buffer = criarXlsBuffer(dados);
    const resultado = parsearXls(buffer);

    expect(resultado.colunasFaltando).toHaveLength(0);
    expect(resultado.linhas[0].nome).toBe('Ana Costa');
    expect(resultado.linhas[0].setor).toBe('Saude');
    expect(resultado.linhas[0].cargo).toBe('Enfermeira');
  });

  it('reporta colunas obrigatorias faltando', () => {
    const dados = [
      {
        Nome: 'Fulano',
        Cargo: 'Teste',
      },
    ];

    const buffer = criarXlsBuffer(dados);
    const resultado = parsearXls(buffer);

    expect(resultado.colunasFaltando).toContain('cpf');
    expect(resultado.colunasFaltando).toContain('dataAdmissao');
    expect(resultado.colunasFaltando).toContain('setor');
    expect(resultado.linhas).toHaveLength(0);
  });

  it('retorna vazio para planilha sem dados', () => {
    const buffer = criarXlsBuffer([]);
    const resultado = parsearXls(buffer);

    expect(resultado.totalLinhas).toBe(0);
    expect(resultado.linhas).toHaveLength(0);
  });

  it('preserva campos opcionais ausentes como falsy', () => {
    const dados = [
      {
        Nome: 'Pedro Lima',
        CPF: '123.456.789-00',
        'Data de Admissao': '2018-05-10',
        Setor: 'Juridico',
      },
    ];

    const buffer = criarXlsBuffer(dados);
    const resultado = parsearXls(buffer);

    expect(resultado.colunasFaltando).toHaveLength(0);
    expect(resultado.linhas[0].cargo).toBeFalsy();
    expect(resultado.linhas[0].dataNascimento).toBeFalsy();
  });
});
