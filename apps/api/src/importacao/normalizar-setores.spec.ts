/* eslint-disable prettier/prettier */
import { LinhaValidada } from './validar-linhas';
import { extrairSetoresDistintos, aplicarNormalizacao, RegraNormalizacao } from './normalizar-setores';

function linhas(setores: string[]): LinhaValidada[] {
  return setores.map((setor, i) => ({
    nome: `Pessoa ${i}`,
    cpf: `0000000000${i}`.slice(-11),
    dataNascimento: undefined,
    dataAdmissao: '2020-01-01',
    cargo: undefined,
    setor,
    linhaOriginal: i + 2,
  }));
}

describe('extrairSetoresDistintos', () => {
  it('conta servidores por setor', () => {
    const resultado = extrairSetoresDistintos(
      linhas(['TI', 'TI', 'Admin', 'Saude', 'Saude', 'Saude'])
    );

    expect(resultado).toHaveLength(3);
    expect(resultado[0]).toEqual({ nomeOriginal: 'Saude', totalServidores: 3 });
    expect(resultado[1]).toEqual({ nomeOriginal: 'TI', totalServidores: 2 });
    expect(resultado[2]).toEqual({ nomeOriginal: 'Admin', totalServidores: 1 });
  });

  it('detecta grafias diferentes como setores distintos', () => {
    const resultado = extrairSetoresDistintos(
      linhas(['TI', 'T.I.', 'Tecnologia', 'TI'])
    );

    expect(resultado).toHaveLength(3);
    expect(resultado.find(s => s.nomeOriginal === 'TI')?.totalServidores).toBe(2);
    expect(resultado.find(s => s.nomeOriginal === 'T.I.')?.totalServidores).toBe(1);
  });
});

describe('aplicarNormalizacao', () => {
  const regraBase: RegraNormalizacao = {
    dePara: { 'T.I.': 'TI', 'Tecnologia': 'TI' },
    guardaChuva: [],
    limiteMinimo: 3,
    nomeGuardaChuva: 'Setores Agrupados',
  };

  it('agrupa grafias equivalentes via de-para', () => {
    const resultado = aplicarNormalizacao(
      linhas(['TI', 'T.I.', 'Tecnologia', 'TI', 'Admin', 'Admin', 'Admin']),
      regraBase
    );

    expect(resultado.totalEleitores).toBe(7);
    const ti = resultado.setores.find(s => s.nomeOficial === 'TI');
    expect(ti?.totalServidores).toBe(4);
    expect(ti?.origens).toEqual(['T.I.', 'TI', 'Tecnologia']);
    expect(ti?.agrupado).toBe(false);
  });

  it('joga setores abaixo do limite para guarda-chuva', () => {
    const resultado = aplicarNormalizacao(
      linhas(['TI', 'TI', 'TI', 'Admin', 'Admin', 'Admin', 'Juridico', 'Financeiro']),
      { ...regraBase, dePara: {} }
    );

    const guardaChuva = resultado.setores.find(s => s.agrupado);
    expect(guardaChuva).toBeTruthy();
    expect(guardaChuva?.totalServidores).toBe(2); // Juridico + Financeiro
    expect(guardaChuva?.origens).toContain('Juridico');
    expect(guardaChuva?.origens).toContain('Financeiro');
  });

  it('marcacao manual vai para guarda-chuva independente do limite', () => {
    const resultado = aplicarNormalizacao(
      linhas(['TI', 'TI', 'TI', 'TI', 'TI', 'Admin', 'Admin', 'Admin', 'Admin', 'Admin']),
      { ...regraBase, guardaChuva: ['Admin'], dePara: {} }
    );

    const guardaChuva = resultado.setores.find(s => s.agrupado);
    expect(guardaChuva?.origens).toContain('Admin');
    expect(guardaChuva?.totalServidores).toBe(5);
  });

  it('nao cria guarda-chuva se todos acima do limite', () => {
    const resultado = aplicarNormalizacao(
      linhas(['TI', 'TI', 'TI', 'Admin', 'Admin', 'Admin']),
      { ...regraBase, dePara: {} }
    );

    const guardaChuva = resultado.setores.find(s => s.agrupado);
    expect(guardaChuva).toBeUndefined();
  });

  it('combina de-para + limite corretamente', () => {
    const resultado = aplicarNormalizacao(
      linhas(['TI', 'T.I.', 'Tecnologia', 'Admin', 'Juridico']),
      regraBase
    );

    // TI = 3 (acima limite) → normal
    // Admin = 1 (abaixo) → guarda-chuva
    // Juridico = 1 (abaixo) → guarda-chuva
    expect(resultado.setores.find(s => s.nomeOficial === 'TI')?.totalServidores).toBe(3);
    const gc = resultado.setores.find(s => s.agrupado);
    expect(gc?.totalServidores).toBe(2);
  });
});
