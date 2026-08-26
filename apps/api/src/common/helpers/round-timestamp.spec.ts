import { arredondarTimestamp } from './round-timestamp';

describe('arredondarTimestamp', () => {
  it('arredonda para baixo dentro de uma janela de 5 min', () => {
    // 14:07:32 → 14:05:00
    const input = new Date('2026-08-26T14:07:32.000Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T14:05:00.000Z'));
  });

  it('arredonda para baixo no limite inferior da janela', () => {
    // 14:04:59 → 14:00:00
    const input = new Date('2026-08-26T14:04:59.999Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T14:00:00.000Z'));
  });

  it('mantém inalterado quando já está no início da janela', () => {
    // 14:00:00 → 14:00:00
    const input = new Date('2026-08-26T14:00:00.000Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T14:00:00.000Z'));
  });

  it('mantém inalterado em múltiplo exato de 5 min', () => {
    // 14:10:00 → 14:10:00
    const input = new Date('2026-08-26T14:10:00.000Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T14:10:00.000Z'));
  });

  it('arredonda corretamente na virada de hora', () => {
    // 14:59:59 → 14:55:00
    const input = new Date('2026-08-26T14:59:59.000Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T14:55:00.000Z'));
  });

  it('arredonda corretamente à meia-noite', () => {
    // 00:03:00 → 00:00:00
    const input = new Date('2026-08-26T00:03:00.000Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T00:00:00.000Z'));
  });

  it('arredonda milissegundos intermediários', () => {
    // 10:12:45.123 → 10:10:00.000
    const input = new Date('2026-08-26T10:12:45.123Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T10:10:00.000Z'));
  });
});
