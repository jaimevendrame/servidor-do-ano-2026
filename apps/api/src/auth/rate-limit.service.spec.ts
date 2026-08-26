/* eslint-disable prettier/prettier */
import { RateLimitService } from './rate-limit.service';

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  del: jest.fn(),
  ttl: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(() => {
    service = new RateLimitService();
    jest.clearAllMocks();
  });

  it('nao esta bloqueado com zero tentativas', async () => {
    mockRedis.get.mockResolvedValue(null);
    expect(await service.estaBloqueado('12345678901')).toBe(false);
  });

  it('nao esta bloqueado com 2 tentativas', async () => {
    mockRedis.get.mockResolvedValue('2');
    expect(await service.estaBloqueado('12345678901')).toBe(false);
  });

  it('esta bloqueado com 3 tentativas', async () => {
    mockRedis.get.mockResolvedValue('3');
    expect(await service.estaBloqueado('12345678901')).toBe(true);
  });

  it('registra falha e retorna contador', async () => {
    mockRedis.incr.mockResolvedValue(1);
    const resultado = await service.registrarFalha('12345678901');
    expect(resultado.tentativas).toBe(1);
    expect(resultado.bloqueado).toBe(false);
    expect(mockRedis.expire).toHaveBeenCalledWith('login:tentativas:12345678901', 900);
  });

  it('bloqueia na terceira falha', async () => {
    mockRedis.incr.mockResolvedValue(3);
    const resultado = await service.registrarFalha('12345678901');
    expect(resultado.bloqueado).toBe(true);
  });

  it('reseta contador no sucesso', async () => {
    await service.resetar('12345678901');
    expect(mockRedis.del).toHaveBeenCalledWith('login:tentativas:12345678901');
  });

  it('retorna tempo restante de bloqueio', async () => {
    mockRedis.ttl.mockResolvedValue(600);
    const ttl = await service.tempoRestante('12345678901');
    expect(ttl).toBe(600);
  });
});
