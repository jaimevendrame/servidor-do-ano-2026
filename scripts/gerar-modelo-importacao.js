/* eslint-disable */
/**
 * Gera o arquivo modelo de importação de eleitores (servidores).
 *
 * Saída: apps/web/public/modelo-importacao-servidores.xlsx
 *
 * As colunas seguem exatamente os cabeçalhos reconhecidos pelo parser
 * (apps/api/src/importacao/parsear-xls.ts). Os CPFs de exemplo são
 * gerados com dígito verificador válido — nenhum dado real de servidor.
 *
 * Rodar: node scripts/gerar-modelo-importacao.js
 */
const path = require('path');
const XLSX = require('xlsx');

// Gera um CPF válido a partir de uma base de 9 dígitos (determinístico).
function gerarCpfValido(base9) {
  const nums = String(base9).padStart(9, '0').slice(0, 9).split('').map(Number);

  const calcDigito = (parciais) => {
    const pesoInicial = parciais.length + 1;
    const soma = parciais.reduce((acc, n, i) => acc + n * (pesoInicial - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = calcDigito(nums);
  const d2 = calcDigito([...nums, d1]);
  const cpf = [...nums, d1, d2].join('');
  // Formata como 000.000.000-00 (o parser aceita com ou sem máscara).
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

// Linhas de exemplo — dados fictícios, nomes genéricos.
const exemplos = [
  {
    'Nome Completo': 'Maria Aparecida da Silva',
    CPF: gerarCpfValido(111222333),
    'Data de Nascimento': '1985-03-12',
    'Data de Admissao': '2010-02-01',
    Cargo: 'Assistente Administrativo',
    'Setor/Lotacao': 'Secretaria de Administracao',
  },
  {
    'Nome Completo': 'Joao Pedro Oliveira',
    CPF: gerarCpfValido(444555666),
    'Data de Nascimento': '1990-07-25',
    'Data de Admissao': '2015-08-15',
    Cargo: 'Analista de Sistemas',
    'Setor/Lotacao': 'Secretaria de Educacao',
  },
  {
    'Nome Completo': 'Ana Carolina Souza',
    CPF: gerarCpfValido(777888999),
    'Data de Nascimento': '1982-11-30',
    'Data de Admissao': '2008-05-20',
    Cargo: 'Fiscal de Obras',
    'Setor/Lotacao': 'Secretaria de Obras',
  },
];

// Ordem das colunas no arquivo: obrigatórias primeiro, opcionais depois.
const ordemColunas = [
  'Nome Completo',
  'CPF',
  'Data de Admissao',
  'Setor/Lotacao',
  'Data de Nascimento',
  'Cargo',
];

const ws = XLSX.utils.json_to_sheet(exemplos, { header: ordemColunas });

// Larguras de coluna para leitura confortável.
ws['!cols'] = [
  { wch: 28 }, // Nome
  { wch: 16 }, // CPF
  { wch: 16 }, // Data de Admissao
  { wch: 28 }, // Setor/Lotacao
  { wch: 18 }, // Data de Nascimento
  { wch: 24 }, // Cargo
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Servidores');

const destino = path.resolve(
  __dirname,
  '..',
  'apps',
  'web',
  'public',
  'modelo-importacao-servidores.xlsx'
);

XLSX.writeFile(wb, destino);
console.log('Modelo gerado em:', destino);
console.log('Colunas:', ordemColunas.join(' | '));
console.log('Linhas de exemplo:', exemplos.length);
