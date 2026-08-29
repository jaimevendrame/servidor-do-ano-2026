/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RateLimitService } from './rate-limit.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let rateLimit: RateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: { eleitor: { findFirst: jest.fn() } },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'mock-token') },
        },
        {
          provide: RateLimitService,
          useValue: {
            estaBloqueado: jest.fn().mockResolvedValue(false),
            registrarFalha: jest.fn().mockResolvedValue({ bloqueado: false, tentativas: 1 }),
            resetar: jest.fn().mockResolvedValue(undefined),
            tempoRestante: jest.fn().mockResolvedValue(900),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    rateLimit = module.get<RateLimitService>(RateLimitService);
  });

  it('retorna token para eleitor valido e reseta contador', async () => {
    const eleitor = {
      id: 1,
      nome: 'Maria',
      cpf: '52998224725',
      edicaoId: 1,
      setorId: 1,
      dataAdmissao: new Date('2015-03-20'),
      cargo: 'Analista',
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      setor: { nomeExibido: 'Admin' },
    };

    (prisma.eleitor.findFirst as jest.Mock).mockResolvedValue(eleitor);

    const resultado = await service.loginEleitor(
      { cpf: '529.982.247-25', dataAdmissao: '2015-03-20', edicaoId: 1 },
      1
    );

    expect(resultado.token).toBe('mock-token');
    expect(resultado.eleitor.nome).toBe('Maria');
    expect(rateLimit.resetar).toHaveBeenCalledWith('52998224725');
  });

  it('registra falha para eleitor nao encontrado', async () => {
    (prisma.eleitor.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.loginEleitor(
        { cpf: '529.982.247-25', dataAdmissao: '2000-01-01', edicaoId: 1 },
        1
      )
    ).rejects.toThrow();

    expect(rateLimit.registrarFalha).toHaveBeenCalledWith('52998224725');
  });

  it('bloqueia login quando CPF esta bloqueado', async () => {
    (rateLimit.estaBloqueado as jest.Mock).mockResolvedValue(true);

    await expect(
      service.loginEleitor(
        { cpf: '529.982.247-25', dataAdmissao: '2015-03-20', edicaoId: 1 },
        1
      )
    ).rejects.toThrow(/bloqueado/);

    expect(prisma.eleitor.findFirst).not.toHaveBeenCalled();
  });
});
