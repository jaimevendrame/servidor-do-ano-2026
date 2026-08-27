/* eslint-disable prettier/prettier */
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('retorna status ok', () => {
    const controller = new HealthController();
    const resultado = controller.check();
    expect(resultado.status).toBe('ok');
    expect(resultado.timestamp).toBeTruthy();
  });
});
