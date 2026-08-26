import { validarCPF } from './validar-cpf';

describe('validarCPF', () => {
  it('aceita CPF valido com pontuacao', () => {
    expect(validarCPF('529.982.247-25')).toBe(true);
  });

  it('aceita CPF valido sem pontuacao', () => {
    expect(validarCPF('52998224725')).toBe(true);
  });

  it('rejeita CPF com digitos repetidos', () => {
    expect(validarCPF('111.111.111-11')).toBe(false);
    expect(validarCPF('000.000.000-00')).toBe(false);
  });

  it('rejeita CPF com tamanho errado', () => {
    expect(validarCPF('123.456.789')).toBe(false);
    expect(validarCPF('12345')).toBe(false);
  });

  it('rejeita CPF com digito verificador invalido', () => {
    expect(validarCPF('529.982.247-26')).toBe(false);
  });
});
