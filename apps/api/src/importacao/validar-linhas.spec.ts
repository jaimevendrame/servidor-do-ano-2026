import { LinhaXlsRaw } from './dto/linha-xls.dto';
import { validarLinhas } from './validar-linhas';

function linha(overrides: Partial<LinhaXlsRaw> = {}): LinhaXlsRaw {
  return {
    nome: 'Maria Silva',
    cpf: '529.982.247-25', // CPF valido
    dataNascimento: '1990-01-15',
    dataAdmissao: '2015-03-20',
    cargo: 'Analista',
    setor: 'Administrativo',
    linhaOriginal: 2,
    ...overrides,
  };
}

describe('validarLinhas', () => {
  it('aceita linha com todos campos validos', () => {
    const resultado = validarLinhas([linha()]);

    expect(resultado.validas).toHaveLength(1);
    expect(resultado.erros).toHaveLength(0);
    expect(resultado.validas[0].cpf).toBe('52998224725'); // limpo
  });

  it('rejeita linha com CPF invalido', () => {
    const resultado = validarLinhas([linha({ cpf: '111.111.111-11' })]);

    expect(resultado.validas).toHaveLength(0);
    expect(resultado.erros).toHaveLength(1);
    expect(resultado.erros[0].campo).toBe('cpf');
  });

  it('rejeita linha com CPF ausente', () => {
    const resultado = validarLinhas([linha({ cpf: undefined })]);

    expect(resultado.validas).toHaveLength(0);
    expect(resultado.erros[0].campo).toBe('cpf');
    expect(resultado.erros[0].motivo).toBe('CPF ausente');
  });

  it('rejeita linha com data de admissao ausente', () => {
    const resultado = validarLinhas([linha({ dataAdmissao: undefined })]);

    expect(resultado.validas).toHaveLength(0);
    expect(resultado.erros[0].campo).toBe('dataAdmissao');
  });

  it('rejeita linha com data de admissao invalida', () => {
    const resultado = validarLinhas([linha({ dataAdmissao: 'nao-e-data' })]);

    expect(resultado.validas).toHaveLength(0);
    expect(resultado.erros[0].motivo).toBe('Data de admissao invalida');
  });

  it('rejeita linha com setor ausente', () => {
    const resultado = validarLinhas([linha({ setor: undefined })]);

    expect(resultado.validas).toHaveLength(0);
    expect(resultado.erros[0].campo).toBe('setor');
  });

  it('rejeita linha com setor vazio', () => {
    const resultado = validarLinhas([linha({ setor: '   ' })]);

    expect(resultado.validas).toHaveLength(0);
    expect(resultado.erros[0].campo).toBe('setor');
  });

  it('deduplicou CPF mantendo admissao mais antiga', () => {
    const linhas = [
      linha({ cpf: '529.982.247-25', dataAdmissao: '2020-01-01', linhaOriginal: 2 }),
      linha({ cpf: '529.982.247-25', dataAdmissao: '2015-06-01', linhaOriginal: 3 }),
    ];

    const resultado = validarLinhas(linhas);

    expect(resultado.validas).toHaveLength(1);
    expect(resultado.validas[0].dataAdmissao).toBe('2015-06-01');
    expect(resultado.duplicados).toHaveLength(1);
    expect(resultado.duplicados[0].linhaRemovida).toBe(2);
    expect(resultado.duplicados[0].linhaPreservada).toBe(3);
  });

  it('reporta multiplos erros na mesma linha', () => {
    const resultado = validarLinhas([
      linha({ cpf: undefined, setor: undefined, dataAdmissao: undefined }),
    ]);

    expect(resultado.validas).toHaveLength(0);
    expect(resultado.erros.length).toBeGreaterThanOrEqual(3);
  });

  it('preserva campos opcionais', () => {
    const resultado = validarLinhas([linha({ cargo: undefined, dataNascimento: undefined })]);

    expect(resultado.validas).toHaveLength(1);
    expect(resultado.validas[0].cargo).toBeUndefined();
    expect(resultado.validas[0].dataNascimento).toBeUndefined();
  });
});
