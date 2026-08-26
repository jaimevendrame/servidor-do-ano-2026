const CINCO_MINUTOS_MS = 5 * 60 * 1000;

/**
 * Arredonda um timestamp para a janela de 5 minutos imediatamente anterior (floor).
 *
 * Usado em Voto.registradoEm e Participacao.registradoEm para impedir
 * correlação por horário entre as duas tabelas.
 *
 * Ex: 14:07:32 → 14:05:00 | 14:04:59 → 14:00:00 | 14:00:00 → 14:00:00
 */
export function arredondarTimestamp(date: Date): Date {
  const ms = date.getTime();
  const arredondado = Math.floor(ms / CINCO_MINUTOS_MS) * CINCO_MINUTOS_MS;
  return new Date(arredondado);
}
