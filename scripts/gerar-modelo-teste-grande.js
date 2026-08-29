/* eslint-disable */
/**
 * Gera um modelo XLS GRANDE para testar a normalização de setores de verdade.
 *
 * Diferente do modelo oficial de download (3 linhas, só ilustra o formato),
 * este arquivo tem setores de tamanhos variados para demonstrar os dois
 * comportamentos convivendo:
 *   - setores grandes  -> viram setores NORMAIS (votação própria)
 *   - setores pequenos -> caem no GUARDA-CHUVA (abaixo do limite mínimo)
 *
 * Saída: apps/web/public/modelo-teste-grande.xlsx
 *
 * Distribuição (39 servidores, 7 setores):
 *   Administrativo -> 12 | Educacao -> 10 | Saude -> 8 | Obras -> 5   (normais com limite 3)
 *   Juridico -> 2 | Ouvidoria -> 1 | Cerimonial -> 1                  (guarda-chuva com limite 3)
 *
 * Nenhum dado real de servidor. CPFs válidos gerados deterministicamente.
 *
 * Rodar: node scripts/gerar-modelo-teste-grande.js
 */
const path = require('path');
const XLSX = require('xlsx');

// Gera um CPF válido a partir de uma base numérica (determinístico, dígitos corretos).
function gerarCpfValido(base9) {
  const nums = String(base9).padStart(9, '0').slice(0, 9).split('').map(Number);

  const calcDigito = parciais => {
    const pesoInicial = parciais.length + 1;
    const soma = parciais.reduce((acc, n, i) => acc + n * (pesoInicial - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = calcDigito(nums);
  const d2 = calcDigito([...nums, d1]);
  const cpf = [...nums, d1, d2].join('');
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

// Nomes fictícios genéricos para compor os servidores.
const NOMES = [
  'Maria Silva', 'Joao Souza', 'Ana Oliveira', 'Pedro Santos', 'Carla Lima',
  'Lucas Pereira', 'Juliana Costa', 'Marcos Almeida', 'Fernanda Rocha', 'Rafael Gomes',
  'Patricia Martins', 'Bruno Carvalho', 'Camila Ribeiro', 'Diego Ferreira', 'Aline Barbosa',
  'Rodrigo Araujo', 'Bianca Melo', 'Gustavo Nunes', 'Larissa Dias', 'Felipe Cardoso',
  'Vanessa Teixeira', 'Thiago Moraes', 'Priscila Freitas', 'Andre Correia', 'Tatiane Pinto',
  'Leonardo Cunha', 'Sabrina Lopes', 'Vinicius Ramos', 'Debora Azevedo', 'Eduardo Mendes',
  'Natalia Cavalcanti', 'Renato Duarte', 'Simone Barros', 'Fabio Nascimento', 'Monica Farias',
  'Gabriel Tavares', 'Renata Vieira', 'Alexandre Reis', 'Cristina Moreira',
];

const CARGOS = ['Analista', 'Assistente', 'Tecnico', 'Coordenador', 'Auxiliar', 'Fiscal'];

// Distribuição de servidores por setor (nome -> quantidade).
const DISTRIBUICAO = [
  ['Administrativo', 12],
  ['Educacao', 10],
  ['Saude', 8],
  ['Obras', 5],
  ['Juridico', 2],
  ['Ouvidoria', 1],
  ['Cerimonial', 1],
];

const linhas = [];
let idxNome = 0;
let baseCpf = 100000000;
let ano = 2005;

for (const [setor, qtd] of DISTRIBUICAO) {
  for (let i = 0; i < qtd; i++) {
    const nome = NOMES[idxNome % NOMES.length];
    idxNome++;
    baseCpf += 1234567; // varia a base para gerar CPFs distintos
    ano = 2005 + ((idxNome * 3) % 18); // datas de admissão espalhadas 2005-2022

    linhas.push({
      'Nome Completo': nome,
      CPF: gerarCpfValido(baseCpf),
      'Data de Admissao': `${ano}-0${1 + (i % 9)}-1${i % 9}`,
      'Setor/Lotacao': setor,
      'Data de Nascimento': `${1970 + (idxNome % 30)}-05-15`,
      Cargo: CARGOS[idxNome % CARGOS.length],
    });
  }
}

const ordemColunas = [
  'Nome Completo',
  'CPF',
  'Data de Admissao',
  'Setor/Lotacao',
  'Data de Nascimento',
  'Cargo',
];

const ws = XLSX.utils.json_to_sheet(linhas, { header: ordemColunas });
ws['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 18 }];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Servidores');

const destino = path.resolve(
  __dirname,
  '..',
  'apps',
  'web',
  'public',
  'modelo-teste-grande.xlsx'
);

XLSX.writeFile(wb, destino);
console.log('Modelo de teste gerado em:', destino);
console.log('Total de servidores:', linhas.length);
console.log('Setores:', DISTRIBUICAO.map(([s, q]) => `${s}(${q})`).join(', '));
