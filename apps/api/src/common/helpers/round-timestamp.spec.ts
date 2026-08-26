import { arredondarTimestamp } from './round-timestamp';

describe('arredondarTimestamp', () => {
  it('arredonda para baixo dentro de uma janela de 5 min', () => {
    // 14:07:32 â†’ 14:05:00
    const input = new Date('2026-08-26T14:07:32.000Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T14:05:00.000Z'));
  });

  it('arredonda para baixo no limite inferior da janela', () => {
    // 14:04:59 â†’ 14:00:00
    const input = new Date('2026-08-26T14:04:59.999Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T14:00:00.000Z'));
  });

  it('mantÃ©m inalterado quando jÃ¡ estÃ¡ no inÃ­cio da janela', () => {
    // 14:00:00 â†’ 14:00:00
    const input = new Date('2026-08-26T14:00:00.000Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T14:00:00.000Z'));
  });

  it('mantÃ©m inalterado em mÃºltiplo exato de 5 min', () => {
    // 14:10:00 â†’ 14:10:00
    const input = new Date('2026-08-26T14:10:00.000Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T14:10:00.000Z'));
  });

  it('arredonda corretamente na virada de hora', () => {
    // 14:59:59 â†’ 14:55:00
    const input = new Date('2026-08-26T14:59:59.000Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T14:55:00.000Z'));
  });

  it('arredonda corretamente Ã  meia-noite', () => {
    // 00:03:00 â†’ 00:00:00
    const input = new Date('2026-08-26T00:03:00.000Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T00:00:00.000Z'));
  });

  it('arredonda milissegundos intermediÃ¡rios', () => {
    // 10:12:45.123 â†’ 10:10:00.000
    const input = new Date('2026-08-26T10:12:45.123Z');
    const resultado = arredondarTimestamp(input);
    expect(resultado).toEqual(new Date('2026-08-26T10:10:00.000Z'));
  });
});
